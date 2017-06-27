import React, { Component } from 'react';
import {
    Text,
    Image,
    View,
    ListView,
    TouchableWithoutFeedback,
    FlatList,
    ActivityIndicator
} from 'react-native';
import storage from 'react-native-modest-storage';
import config from '../config.json';
import style from './Style';
import {LikeAndDownload} from './LikeAndDownload';
import {Get} from './Request';
import Icon from 'react-native-vector-icons/FontAwesome';
var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
class ArtList extends Component {

    constructor(props) {
        super(props);
        this.renderCategoryRow = this.renderCategoryRow.bind(this);
        this.renderNewsRow = this.renderNewsRow.bind(this);
        this.goToArticle = this.goToArticle.bind(this);
        this.getNews = this.getNews.bind(this);
        this.getNewsData = this.getNewsData.bind(this);
        this.renderNewsFooter = this.renderNewsFooter.bind(this);
        this.reloadCategories = this.reloadCategories.bind(this);
        this.reloadList = this.reloadList.bind(this);
        this.onLayout = this.onLayout.bind(this);
        this.state = {
            events: this.props.screenProps.events,
            selected: '0',
            showImage: true,
            categoriesData: [],
            categories: ds.cloneWithRows([]),
            noProvider: false,
            newsData: [],
            showNews: true,
            newsColumnCount: 1,
            loadingNews: true,
            loadingNewsButton: false,
            moreDataAvailable: false,
            waitingForRequestToFinish: false,
            badRequest: false,
            allowRedirection: true,
        }
        this.reloadList();
    }

    componentWillMount() {
        var obj = this;
        this.state.events.addListener("showImage", function(show){
            obj.setState({
                showImage: show
            })
        })
        this.state.events.addListener("reloadCategories", () => obj.reloadList(true))
    }

    reloadCategories() {
        var obj = this;
        return storage.get(config.keys.selected)
            .then(function(data) {
                if (data === null || typeof data.data === "undefined") {
                    obj.setState({
                        noProvider: true,
                        showNews: false,
                        loadingNews: false,
                        categoriesData: [],
                        categories: ds.cloneWithRows([])
                    })
                    return null;
                } else {
                    if (parseInt(data.selected, 10) >= data.data.length)
                        data.selected = "0";
                    obj.setState({
                        noProvider: false,
                        selected: data.selected,
                        categoriesData: data.data,
                        categories: ds.cloneWithRows(data.data)
                    })
                    return data.selected;
                }
            });
    }

    reloadList(force) {
        var obj = this;
        var initQuery = (typeof force === 'undefined') ? true : this.state.newsData.length === 0;
        this.reloadCategories()
        .then(function(selected) {
            if (typeof selected !== "undefined" && initQuery)
                obj.getNews(selected);
        })

    }

    onLayout(e) {
        this.setState({
            newsColumnCount: e.nativeEvent.layout.width > 600 ? 2 : 1
        })
    }

    render() {
        return (
            <View style={style.container} onLayout={this.onLayout}>
                {this.state.categoriesData.length > 0 &&
                    <ListView 
                    style={style.tabs}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    dataSource={this.state.categories}
                    renderRow={this.renderCategoryRow} />
                }
                {this.state.showNews &&                    
                    <FlatList
                    numColumns={this.state.newsColumnCount}
                    data={this.state.newsData}
                    renderItem={({item}) => this.renderNewsRow(item) }
                    removeClippedSubviews={false}
                    keyExtractor={(item) => item.id}
                    refreshing={this.state.loadingNews}
                    onRefresh={() => this.getNews(this.state.selected)}
                    onEndReachedThreshold={0.5}
                    onEndReached={(diff) => this.getNews()}
                    ListFooterComponent={this.renderNewsFooter}/>
                }

                {this.state.noProvider &&
                    <View style={style.notificationWrap}>
                        <Text style={style.notification}>¯\_(ツ)_/¯</Text>
                        <Text style={style.notification}>{config.text.listview_noprovider}</Text>
                         <TouchableWithoutFeedback onPress={() => this.props.navigation.navigate("General")}>
                            <Icon size={40} color="#913D88" name="wrench"/>
                        </TouchableWithoutFeedback>
                    </View> 
                }
                {this.state.badRequest &&
                    <View style={style.notificationWrap}>
                        <Text style={style.notification}>¯\_(ツ)_/¯</Text>
                        <Text style={style.notification}>{config.text.badrequest}</Text>
                        <TouchableWithoutFeedback onPress={() => this.getNews(this.state.selected)}>
                            <View style={style.loadMore}>
                                <Text style={style.loadMoreText}>{config.text.tryagain.toUpperCase()}</Text>
                            </View>
                        </TouchableWithoutFeedback>
                    </View> 
                }
            </View>
        );
    }

    renderNewsRow(item) {
        return (
            <TouchableWithoutFeedback 
                onPress={() => {this.goToArticle(item.id, item.provider)}}>
                <View style={style.listitem}>
                    {this.state.showImage &&
                        <Image
                        style={style.listpicture}
                        source={{uri: item.mainpicture}} />
                    }
                    <View style={[style.listcontentWithoutImage, this.state.showImage && style.listcontent]}>
                        <Text>{item.category}</Text>
                        <Text style={style.listtitle}>
                            {item.permissions &&
                                <Icon name="lock" size={20}/>
                            }
                            {item.title}
                        </Text>

                        <LikeAndDownload provider={item.provider} id={item.id} title={item.title} events={this.state.events}/>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        );
    }

    renderNewsFooter() {
        return (
            <View>
                {this.state.moreDataAvailable &&
                    <View>
                    {this.state.loadingNewsButton ? (
                        <ActivityIndicator style={style.loadMoreIndicator} color="black" />
                    ) : (
                        <TouchableWithoutFeedback onPress={() => this.getNews()}>
                            <View style={style.loadMore}>
                                <Text style={style.loadMoreText}>{config.text.more.toUpperCase()}</Text>
                            </View>
                        </TouchableWithoutFeedback>
                   )}
                    </View>
                 }
            </View>
        );
    }

    goToArticle(id, provider) {
        if (this.state.allowRedirection)
            this.props.navigation.navigate("Art", {provider:provider,article:id,storedArticle:false,showImage:this.state.showImage});
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

    renderCategoryRow(item, sectionId, rowId) {
        var active = rowId === this.state.selected;
        return (
            <TouchableWithoutFeedback 
                onPress={() => {this.getNews(rowId)}}>
                <View>
                    <Text  style={[styles.tab, active && styles.tabActive]} >
                        {item.text}
                    </Text>
                </View>
            </TouchableWithoutFeedback>
        );
    }

    getNews(rowId) {
        if (this.state.waitingForRequestToFinish)
            return false;
        var searchItem = this.state.categoriesData[parseInt(this.state.selected)];
        var lastId = this.state.lastArticleId;
        var lastDate = this.state.lastArticleDate;
        var newsData = this.state.newsData;
        if (rowId || rowId === 0){
            searchItem = this.state.categoriesData[parseInt(rowId)];
            lastId = null;
            lastDate = null;
            newsData = [];
            this.setState({
                selected: rowId,
                showNews: true,
                categories: ds.cloneWithRows(this.state.categoriesData),
                lastArticleId: null,
                lastArticleDate: null,
                badRequest: false,
                newsData: [],
                moreDataAvailable: false,
                loadingNews: true
            });
            storage.set(config.keys.selected, {
                selected: rowId,
                data: this.state.categoriesData,
                showImage: this.state.showImage
            })
        } else {
            if (!this.state.moreDataAvailable)
                return false;
            this.setState({
                loadingNewsButton: true
            })
        }
        this.setState({
            waitingForRequestToFinish: true
        })
        this.getNewsData(searchItem, lastId, lastDate, newsData);
    }

    getNewsData(searchItem, lastId, lastDate, newsData) {
        var url = config.domain + config.endpoints.news + "?provider=" + searchItem.provider;
        url += (typeof searchItem.category !== "undefined") ? "&category=" + searchItem.category : "";
        url += (lastDate) ? "&date=" + lastDate : "";
        url += (lastId) ? "&id=" + lastId : "";
        var obj = this;
        Get(url)
        .then(function(data) {
            if (data.length === config.articlebatchcount)
                obj.setState({
                    lastArticleId: data[data.length - 1].id,
                    lastArticleDate: data[data.length - 1].published,
                    moreDataAvailable: true
                })
            else
                obj.setState({
                    moreDataAvailable: false
                })
            obj.setState({
                loadingNews: false,
                loadingNewsButton: false,
                waitingForRequestToFinish: false,
                newsData: newsData.concat(data)
            })
        })
        .catch((error) => {
            obj.setState({
                showNews: false,
                badRequest: true,
                loadingNews: false,
                waitingForRequestToFinish: false
            })
        })
    }
}
export default ArtList;
