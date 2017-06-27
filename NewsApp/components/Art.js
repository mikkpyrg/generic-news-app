import React, { Component } from 'react';
import { Linking, View, Text, Image, ActivityIndicator, FlatList, Dimensions,Platform, TouchableWithoutFeedback } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import storage from 'react-native-modest-storage';
import config from '../config.json';
import {Get} from './Request';
import style from './Style';
import {LikeAndDownload} from './LikeAndDownload';
// https://spdx.org/licenses/ISC
import HTMLView from 'react-native-htmlview';
var imgPrefix = Platform.OS === 'android' ? 'file://'   : '';

class Art extends Component {
    constructor(props){
        super(props);
        var height = Dimensions.get('window').width * 0.66;
        height = (height > 500) ? 500 : height;
        this.state = {
            events: this.props.screenProps.events,
            provider: this.props.navigation.state.params.provider,
            article: this.props.navigation.state.params.article,
            storedArticle: this.props.navigation.state.params.storedArticle,
            showImage: this.props.navigation.state.params.showImage,
            refreshing: true,
            failed: false,
            articleData: [],
            showArticle: false,
            lockedArticle: false,
            imageHeight: height,
        };
        this.getArticle = this.getArticle.bind(this);
        this.getRemoteArticle = this.getRemoteArticle.bind(this);
        this.getLocalArticle = this.getLocalArticle.bind(this);
        this.renderArticle = this.renderArticle.bind(this);
        this.renderParagraphs = this.renderParagraphs.bind(this);
    }

    componentWillMount(){
        this.getArticle();
    }

    getArticle() {
        this.setState({
            refreshing: true,
            failed: false
        })
        var article;
        if (this.state.storedArticle)
            article = this.getLocalArticle(this.state.article);
        else
           article = this.getRemoteArticle(this.state.provider, this.state.article);
        var obj = this;
        article.then(function(data) {
            obj.setState({
                articleData: [{
                    paragraphs: (data.data.paragraphs === null) ? [] : data.data.paragraphs,
                    id: data.data.id,
                    mainpicture: data.data.mainpicture,
                    title: data.data.title,
                    summary: data.data.summary,
                    category: data.data.category,
                    published: obj.parseDate(data.data.published),
                    lockedArticle: data.code
                }],
                refreshing: false,
                showArticle: true,
            })
            if (data.token)
                storage.set(config.keys.providerToken + obj.state.provider, data.token)
        })
        .catch(function(){
            obj.setState({
                refreshing:false,
                failed: true
            })
        })

    }

    parseDate(date){
        if (typeof date === "undefined")
            return null;
        var time = new Date(date);
        var month = (time.getMonth() < 9) ? "0" + (time.getMonth() + 1).toString() : time.getMonth();
        var formatDate = time.getHours() + ":" + time.getMinutes() + " " + time.getDate() + "." + month + "." + time.getFullYear();
        return formatDate;
    }

    getRemoteArticle(provider, article) {
        var obj = this;
        return storage.get(config.keys.providerToken + provider)
        .then(function(token) {
            var url = config.domain + config.endpoints.news + article;
            url += (token !== null) ? "?token=" + token : "";
            return Get(url)
        })
    }

    getLocalArticle(article) {
        return storage.get(config.keys.articleStore + article)
        .then(function(data){
            if(data === null) {
                throw "error";
            } else {
                return {data:data};
            }
        })
    }

    goToShop() {
        Linking.canOpenURL("https://pood.aripaev.ee")
        .then(supported => {
            if (supported) {
                return Linking.openURL("https://pood.aripaev.ee");
            }
        })
        .catch(err => console.error('An error occurred', err))
    }

    renderArticle(item) {
        var image = this.state.storedArticle ? imgPrefix + item.mainpicture : item.mainpicture;
        return (
        <View style={style.articleWrap}>
            {this.state.showImage && item.mainpicture &&
                <Image style={{height: this.state.imageHeight, flex:1}}
                    source={{uri: image}} />
            }
            <View style={style.articleInfo}>
                <Text style={style.padText}>{item.published}</Text>
                <Text>{item.category}</Text>
            </View>
            <Text style={style.articleTitle}>{item.title}</Text>
            <Text style={style.articleSummary}>{item.summary}</Text>
            {item.lockedArticle &&
                <View style={style.notificationWrap}>
                    <Text style={style.notification}>¯\_(ツ)_/¯</Text>
                    <Text style={style.notification}>{config.text.lockedarticle}</Text>
                    <TouchableWithoutFeedback onPress={this.goToShop}>
                        <View style={style.loadMore}>
                            <Text style={style.loadMoreText}>{config.text.order.toUpperCase()}</Text>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            }

            {this.renderParagraphs(item.paragraphs)}

            

            <View style={style.articleNav}>  
                <View style={style.articleNavLeft}>         
                    <TouchableWithoutFeedback onPress={() => this.props.navigation.navigate('ArtList')}>
                        <Icon name="home" size={40} color="#03A678" />
                    </TouchableWithoutFeedback>
                </View>

                <LikeAndDownload provider={this.state.provider} id={this.state.article} title={item.title} events={this.state.events}/>
                <View style={style.articleNavRight}>  
                    <TouchableWithoutFeedback onPress={() => this.props.navigation.goBack()}>
                        <Icon name="arrow-left" size={35} color="#663399" />
                    </TouchableWithoutFeedback>
                </View>
            </View>
        </View>
        )
    }

    renderParagraphs(paragraphs) {
        var obj = this;
        return paragraphs.map(function(paragraph, i){
            var img = paragraph.type === 'img' ? 
                ( obj.state.storedArticle ? imgPrefix + paragraph.content : paragraph.content ) 
                : '';
            return (
                <View key={i}>
                    {img !== '' && obj.state.showImage &&
                        <Image style={{height: obj.state.imageHeight, flex:1}}
                            source={{uri: img}} />
                    }
                    {paragraph.type === 'text' &&
                        <HTMLView value={paragraph.content} stylesheet={style}
                            onLinkPress={(url) => 
                            Linking.canOpenURL(url).then(supported => {
                                if (supported) {
                                    return Linking.openURL(url);
                                }
                            }).catch(err => console.error('An error occurred', err))
                        } />
                    }
                </View>
            )
        })
    }

    render() {
        return (
            <View style={style.container}>
                {this.state.showArticle &&
                    <FlatList
                    data={this.state.articleData}
                    renderItem={({item}) => this.renderArticle(item) }
                    keyExtractor={(item) => item.id} />
                }
                {this.state.failed &&
                    <View style={style.notificationWrap}>
                        <Text style={style.notification}>¯\_(ツ)_/¯</Text>
                        <Text style={style.notification}>{config.text.badrequest}</Text>
                        <TouchableWithoutFeedback onPress={this.getArticle}>
                            <View style={style.loadMore}>
                                <Text style={style.loadMoreText}>{config.text.tryagain.toUpperCase()}</Text>
                            </View>
                        </TouchableWithoutFeedback>
                    </View> 
                }
                {this.state.refreshing &&
                    <ActivityIndicator size="large" style={style.storageIndicator} color="black" />
                }
            </View>
        );
    }
}

export default Art;
