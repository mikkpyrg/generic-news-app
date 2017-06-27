import React, { Component } from 'react';
import {View, TouchableWithoutFeedback, ActivityIndicator} from 'react-native';
import storage from 'react-native-modest-storage';
import style from './Style';
import Icon from 'react-native-vector-icons/FontAwesome';
import config from '../config.json';
import {Post, Get, Guid} from './Request';
import RNFetchBlob from 'react-native-fetch-blob';
const dir = RNFetchBlob.fs.dirs.DocumentDir + "/";

export class Like extends Component {
    constructor(props) {
        super(props);
        this.onPress = this.onPress.bind(this);
        this.saveLike = this.saveLike.bind(this);
        this.state = {
            id: this.props.id,
            provider: this.props.provider,
            title: this.props.title,
            events: this.props.events,
            name: "bookmark",
            color: "#F5AB35",
            clickable: true,
            loading: false
        };

    }
    onPress() {
        if (!this.state.clickable)
            return false
        this.setState({
            loding: true,
            clickable: false
        })
        var obj = this;
        storage.get(config.keys.providerToken + this.state.provider)
        .then(function(token) {
            if (token === null) {
                obj.saveLike({
                    provider: obj.state.provider,
                    article: obj.state.id,
                    title: obj.state.title})
                return false;
            }
            var body = {
                'id': obj.state.id.toString(),
                'token': token
            }
            Post(config.domain + config.endpoints.bookmark, body)
            .then(function(data){
                obj.saveLike({
                    provider: obj.state.provider,
                    id: data.id,
                    article: obj.state.id,
                    title: obj.state.title
                })
            })
            .catch(function(e) {
                obj.setState({
                    name: "exclamation-triangle",
                    loading: false,
                    color: "#EC644B"
                })
            })
        })
    }

    saveLike(data) {
        this.state.events.emit("saveBookmark", data);
        this.setState({
            name: "check",
            loading: false,
            color: "#03A678"
        }) 
    }

    render() {
        return (
            <View style={style.artPluginWrap}>
            {this.state.loading ? (
                <ActivityIndicator style={style.likeIndicator} color="black" />
            ) : (
                <TouchableWithoutFeedback onPress={this.onPress}>
                    <Icon name={this.state.name} color={this.state.color} size={40} />
                </TouchableWithoutFeedback>
            )}
            </View>
        );
    }
}

export class Download extends Component {
    constructor(props) {
        super(props);
        super(props);
        this.onPress = this.onPress.bind(this);
        this.saveDownload = this.saveDownload.bind(this);
        this.state = {
            id: this.props.id,
            title: this.props.title,
            events: this.props.events,
            provider: this.props.provider,
            name: "cloud-download",
            color: "#59ABE3",
            clickable: true,
            loading: false,
        };
    }
    onPress() {
        if (!this.state.clickable)
            return false
        this.setState({
            loding: true,
            clickable: false
        })
        var obj = this;

        storage.get(config.keys.articleStore + this.state.id)
        .then(function(data){
            if (data === null)
                return false;
            if (data.mainpicture)
                 RNFetchBlob.fs.unlink(data.mainpicture)
             if (data.paragraphs)
                for (var i=0, il=data.paragraphs.length; i<il; ++i) {
                    if(data.paragraphs[i].type === "img")
                        RNFetchBlob.fs.unlink(data.paragraphs[i].content).then(function(data){console.log("iamge deleted", data.path())});
                }
        })

        storage.get(config.keys.providerToken + this.state.provider)
        .then(function(token) {
            var url = config.domain + config.endpoints.news + obj.state.id;
            url += (token !== null) ? "?token=" + token : "";
            Get(url)
            .then(function(article){
                if (article.token)
                    storage.set(config.keys.providerToken + obj.state.provider)

                if (article.data.mainpicture) {
                    var imagepath = dir + Guid();
                    var imageurl = article.data.mainpicture;
                    obj.saveImage(imagepath, imageurl)
                    article.data.mainpicture = imagepath
                }

                if (article.data.paragraphs)
                    for (var i=0, il=article.data.paragraphs.length; i<il; ++i) {
                        if(article.data.paragraphs[i].type === "img") {
                            var imagepath = dir + Guid();
                            var imageurl = article.data.paragraphs[i].content;
                            obj.saveImage(imagepath, imageurl)
                            article.data.paragraphs[i].content = imagepath
                        }
                    }

                storage.set(config.keys.articleStore + obj.state.id, article.data);
                storage.get(config.keys.articleList)
                .then(function(data){
                    data = data || {};
                    data[obj.state.id] = {provider: obj.state.provider, title: article.data.title, article: obj.state.id};
                    storage.set(config.keys.articleList, data)
                    .then(function(){
                        obj.saveDownload();
                    })
                })
            })
        })
        .catch(function(er){
            obj.setState({
                name: "exclamation-triangle",
                loading: false,
                color: "#EC644B"
            })
        })
        this.saveDownload({
            article: obj.state.id,
            title: obj.state.title})
    }

    saveImage(path, url) {
        RNFetchBlob
        .config({
            fileCache : true,
            path: path
        })
        .fetch('GET', url)
        .then((res) => {
            console.log('The file saved to ', res.path())
        })
    }

    saveDownload() {
        this.state.events.emit("reloadDownload");
        this.setState({
            name: "check",
            loading: false,
            color: "#03A678"
        }) 
    }

    render() {
        return (
            <View style={style.artPluginWrap}>
            {this.state.loading ? (
                <ActivityIndicator style={style.likeIndicator} color="black" />
            ) : (
                <TouchableWithoutFeedback onPress={this.onPress}>
                    <Icon name={this.state.name} color={this.state.color} size={40} />
                </TouchableWithoutFeedback>
            )}
            </View>
        );
    }
}

export class LikeAndDownload extends Component {
    constructor(props) {
        super(props);
        this.state = {
            id: this.props.id,
            provider: this.props.provider,
            title: this.props.title,
            events: this.props.events
        };

    }
    render() {
        return (
            <View style={style.artPlugin}>
                <Like provider={this.state.provider} id={this.state.id} title={this.state.title} events={this.state.events}/>
                <Download provider={this.state.provider} id={this.state.id} title={this.state.title} events={this.state.events}/>
            </View>
        );
    }
}
