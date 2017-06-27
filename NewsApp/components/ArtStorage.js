import React, { Component } from 'react';
import { View, Text, FlatList, TouchableWithoutFeedback, ActivityIndicator, Animated} from 'react-native';
import style from './Style';
import config from '../config.json';
import Icon from 'react-native-vector-icons/FontAwesome';
import storage from 'react-native-modest-storage';
import {Get,Delete,Guid} from './Request';
import RNFetchBlob from 'react-native-fetch-blob';


class ArtStorage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected: 0,
            refreshing: false,
            bookmarkData: [],
            bookmarkListData: [],
            downloadData: [],
            downloadListData: [],
            columnCount: 1,
            screenWidth: 600,
            events: this.props.screenProps.events,
            showImage: true,
            allowRedirection: true
        };
        this.changeTab = this.changeTab.bind(this);
        this.refreshBookmarks = this.refreshBookmarks.bind(this);
        this.renderRow = this.renderRow.bind(this);
        this.saveBookmark = this.saveBookmark.bind(this);
        this.reloadList = this.reloadList.bind(this);
        this.reloadDownload = this.reloadDownload.bind(this);
        this.removeBookmark = this.removeBookmark.bind(this);
        this.removeStoredArticle = this.removeStoredArticle.bind(this);
        this.goToArticle = this.goToArticle.bind(this);
        this.onLayout = this.onLayout.bind(this);
        this.bookmarkInit = this.bookmarkInit.bind(this);
        var obj = this;
       /* storage.set(config.keys.providers, [
            {id:"1",name:"Äripäev", logintype:"oauth", categories:"uudised,börsiuudised"},
            {id:"2",name:"Põllumajandus", categories:"uudised,börsiuudised"}
        ]);*/
       /* storage.set(config.keys.bookmarks, {
            "1":{provider: "1",
                data: [{id:"1", article:"5",  provider:"1",title:"getwreketet"},{id:"2",  provider:"1",article:"4", title:"Jungle boys Jungle boys Jungle boys Jungle boys Jungle bookmarksync Jungle boys"}]},
            '2':{provider: "2", 
                data:[{id:"3", article:"3", provider:"2",title:"Maggy whatshername"},{id:"4",  provider:"2",article:"2", title:"john Travolta"}]}
        });*/
        //storage.remove(config.keys.bookmarks);
        storage.get(config.keys.selected)
        .then(function(data){
            if (data !== null && typeof data.showImage !== "undefined")
                obj.setState({
                    showImage: data.showImage
                })
        })
        this.reloadDownload();
        this.bookmarkInit();
    }

    componentWillMount() {
        this.state.events.addListener("saveBookmark", this.saveBookmark)
        this.state.events.addListener("reloadBookmarks", this.bookmarkInit)
        this.state.events.addListener("reloadDownload", this.reloadDownload)
        var obj = this;
        this.state.events.addListener("showImage", function(show){
            obj.setState({
                showImage: show
            })
        })
    }

    bookmarkInit() {
        var obj = this;
        storage.get(config.keys.bookmarks)
        .then(function(data){
            data = data || {};
            obj.setState({
                bookmarkData: data
            })
            obj.reloadList(data);
        })
    }

    reloadDownload() {
        var obj = this;
        storage.get(config.keys.articleList)
        .then(function(data) {
            var displayList = [];
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    displayList.push(data[key]);
                }
            }
            displayList.push({blank:true, article:Guid()});
            obj.setState({
                downloadData: data,
                downloadListData: displayList
            })
        })
    }

    saveBookmark(newBookmark) {
        var obj = this;
        var data = this.state.bookmarkData;
        var provider = newBookmark.provider;
        var newData = this.addToBookmarkGroup(newBookmark, data[provider]);
        data[provider] = newData;
        storage.set(config.keys.bookmarks, data)
        this.setState({
                bookmarkData: data
            })
        this.reloadList(data);
    }

    addToBookmarkGroup(newBookmark, data) {
        if (typeof data === "undefined" || data === null)
            return {provider:newBookmark.provider,data:[{
                    id:newBookmark.id, 
                    article:newBookmark.article,
                    provider:newBookmark.provider,
                    title:newBookmark.title}]}

        var duplicate = false;
        for (var i=0, il=data.data.length; i<il; ++i) {
            var content = data.data[i];
            if (content.article === newBookmark.article) {
                duplicate = true;
                content.title = newBookmark.title;
                content.id = newBookmark.id;
                data.data[i] = content;
                break;
            }
        }
        if (!duplicate)
            data.data.push({
                id: newBookmark.id,
                article: newBookmark.article,
                provider: newBookmark.provider,
                title: newBookmark.title
            })
        return data;
    }

    changeTab(selected) {
        if (this.state.refreshing)
            return false;
        this.setState({
            selected: selected
        })
    }

    removeBookmark(article, provider) {
        if (this.state.refreshing)
            return false;
        var data = this.state.bookmarkData;
        var deletedArticle = null;
        for (var i=0, il=data[provider].data.length; i<il; ++i) {
            var item = data[provider].data[i];
            if (item.article === article) {
                deletedArticle = item;
                data[provider].data.splice(i,1);
                break;
            }
        }
        if (deletedArticle === null)
            return false;

        storage.set(config.keys.bookmarks, data);
        this.setState({
            bookmarkData: data
        })
        this.reloadList(data);
        var obj = this;
        storage.get(config.keys.providerToken + provider)
        .then(function(token){
            if (token !== null)
                Delete(config.domain + config.endpoints.bookmark + deletedArticle.id, {token: token})
                .catch(function(){})
        })
    }

    removeStoredArticle(article) {
        var storedArticles = this.state.downloadData;
        delete storedArticles[article];
        var obj = this;
        storage.set(config.keys.articleList, storedArticles)
        .then(function(){
            obj.reloadDownload();
        })
        storage.get(config.keys.articleStore + article)
        .then(function(data){
            if (data === null)
                return false;
            if (data.mainpicture)
                 RNFetchBlob.fs.unlink(data.mainpicture)
            if (data.paragraphs)
                for (var i=0, il=data.paragraphs.length; i<il; ++i) {
                    if(data.paragraphs[i].type === "img")
                        RNFetchBlob.fs.unlink(data.paragraphs[i].content)
                }
            storage.remove(config.keys.articleStore + article);
        })
    }

    reloadList(data) {
        var displayList = [];
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                displayList = displayList.concat(data[key].data);
            }
        }
        displayList.push({blank:true, article:Guid()});
        this.setState({
            bookmarkListData: displayList,
            refreshing: false
        })
    }

    refreshBookmarks() {
        if (this.state.refreshing)
            return false;
        this.setState({
            refreshing: true
        })
        var bookmarks = this.state.bookmarkData;
        var obj = this;
        storage.get(config.keys.providers)
        .then(function(providers){
            if (providers === null) {
                obj.setState({
                    refreshing: false
                })
                return false;
            }
            var providerIds = providers.map(x => config.keys.providerToken +  x.id);
            storage.get(providerIds)
            .then(function(tokens){
                tokens = tokens.filter(x => x !== null);
                var limit = tokens.length
                var count = 0;
                for (var i=0; i<limit; ++i) {
                    Get(config.domain + config.endpoints.bookmark + "?token=" + tokens[i])
                    .then(function(syncedData){
                        bookmarks[syncedData.provider] = {
                            provider:syncedData.provider.toString(), 
                            data: syncedData.data
                        }
                        count++;
                        if (count >= limit)
                            obj.reloadList(bookmarks);
                    })
                    .catch(function(){
                        count++;
                        if (count >= limit)
                            obj.reloadList(bookmarks);
                    })
                }
                if (count >= limit)
                    obj.reloadList(bookmarks);
            })
        })
    }

    goToArticle(provider, article, storedArticle) {
        if (this.state.allowRedirection)
            this.props.navigation.navigate("Art", {provider:provider,article:article,storedArticle:storedArticle,showImage:this.state.showImage});
        this.setState({
            allowRedirection: false
        })
        var obj = this;
        setTimeout(function() {
            obj.setState({
                allowRedirection: true
            })
        }, 1000);
    }

    renderRow(item, storedArticle, clickfunction) {
        var anim = new Animated.Value(this.state.screenWidth);
        return (
            <View style={style.bookmarkContainer}>
            {item.blank ? (
                <View style={style.bookmarkContainer}></View>
            ) : (
                <TouchableWithoutFeedback onPress={() => this.goToArticle(item.provider, item.article, storedArticle)} >
                <View style={style.bookmarkItem}>
                    <Text style={style.bookmarkTitle}>{item.title}</Text> 
                    <TouchableWithoutFeedback onPress={() =>
                    Animated.timing(
                        anim,
                        {toValue: 0,
                        duration: 350
                        }).start()} >
                        <Icon name="trash" size={25} color="#EC644B" style={style.confirmationButtons}/>
                    </TouchableWithoutFeedback>
                    <Animated.View style={{
                        top:0,
                        left:0,
                        right:0,
                        bottom:0,
                        position: 'absolute',
                        backgroundColor: '#d6a3e6',
                        transform: [{translateX: anim}]
                    }}>
                        <View style={style.confirmation}>

                        <Text>{config.text.confirmation}</Text>
                        <TouchableWithoutFeedback onPress={() => clickfunction(item.article, item.provider)}>
                            <Icon name="check" size={25} color="#96281B" style={style.confirmationButtons}/>
                        </TouchableWithoutFeedback>
                        <TouchableWithoutFeedback onPress={() => Animated.timing(
                                anim,
                                {toValue: this.state.screenWidth,
                                duration: 350
                                }).start()} >
                            <Icon name="times" size={25} color="#1E824C" style={style.confirmationButtons}/>
                        </TouchableWithoutFeedback>
                        </View>
                    </Animated.View>
                </View>
                </TouchableWithoutFeedback>
            )}
            </View>
        );
    }

    onLayout(e) {
        this.setState({
            columnCount: e.nativeEvent.layout.width > 600 ? 2 : 1
        })
    }

    render() {
        return (
            <View style={style.container} onLayout={this.onLayout}>
                <View style={style.extraTabs}>
                    <TouchableWithoutFeedback onPress={() => this.changeTab(0)}>
                        <Icon style={style.extraTab} name="book" color={this.state.selected === 1 ? "#95A5A6" : "#F5AB35"} size={45} />
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback onPress={this.refreshBookmarks}>
                        <Icon style={style.extraTab} name="refresh" color="#00B16A" size={45} />
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback onPress={() => this.changeTab(1)}>
                        <Icon style={style.extraTab} name="hdd-o" color={this.state.selected === 0 ? "#95A5A6" : "#59ABE3"} size={45} />
                    </TouchableWithoutFeedback>
                </View>

                {this.state.selected <= 0 ? (
                    <FlatList
                    numColumns={this.state.columnCount}
                    data={this.state.bookmarkListData}
                    renderItem={({item}) => this.renderRow(item, false, this.removeBookmark) }
                    keyExtractor={(item) => item.article} />
                ) : (
                    <FlatList
                    numColumns={this.state.columnCount}
                    data={this.state.downloadListData}
                    renderItem={({item}) => this.renderRow(item, true, this.removeStoredArticle) }
                    keyExtractor={(item) => item.article} />
                )}
                {this.state.refreshing &&

                    <ActivityIndicator size="large" style={style.storageIndicator} color="black" />
                }
            </View>
        );
    }
}
export default ArtStorage;
