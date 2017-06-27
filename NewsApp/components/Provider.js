import React, { Component } from 'react';
import { View, Text, Switch, FlatList, TouchableWithoutFeedback, Linking, ActivityIndicator, Alert} from 'react-native';
import storage from 'react-native-modest-storage';
import config from '../config.json';
import style from './Style';
import Icon from 'react-native-vector-icons/FontAwesome';
import {Post, GetQueryStringMap} from './Request';
class Settings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            events: this.props.screenProps.events,
            provider: this.props.navigation.state.params.provider,
            showImage: this.props.navigation.state.params.showImage,
            settingsData: [],
            login: false,
            loginmethod: true,
            selected: {},
            badRequest: false,
            loading: false
        };
        this.loadList = this.loadList.bind(this);
        this.renderOptions = this.renderOptions.bind(this);
        this.renderRow = this.renderRow.bind(this);
        this.login = this.login.bind(this);
        this.parseSelection = this.parseSelection.bind(this);
        this._logout = this._logout.bind(this);
        this._login = this._login.bind(this);
    }

    componentWillMount() {
        var obj = this;
        if (this.state.provider.logintype) {
            this.setState({
                login: true
            })
            storage.get(config.keys.providerToken + this.state.provider.id)
            .then(function(token){
                if (token !== null)
                    obj.setState({
                        loginmethod: false
                    })
                obj.loadList()
            })
        } else {
            obj.loadList()
        }

    }

    componentDidMount() {
        var obj = this;
        Linking.addEventListener('url', function(data) {
            var url = data.url
            if (url) {
                var params = GetQueryStringMap(url);
                storage.get(config.keys.login)
                .then(function(data) {
                    if (typeof data === "undefined")
                        return false;
                    if (data.logintype === 'oauth' && params.state === data.state) {
                        return Post(config.domain + config.endpoints.login, {provider: data.provider, code: params.code})
                        .then(function(token) {
                            obj._login(data.provider, token.token);
                        })
                    }
                })
                .catch(function(){});
            }
        });
        
    }

    loadList() {
        var provider = this.state.provider.id;
        var name = this.state.provider.name;
        var description = this.state.provider.description;
        var categories = this.state.provider.categories;
        var options = [{provider: provider, text: name}]
        if (categories)
            categories.split(",").map(x => options.push({provider: provider, text: name + " " + x, category: x}))
        var obj = this;
        storage.get(config.keys.selected)
        .then(function(data){
            if (data && data.data) {
                var selectedOptions = data.data.filter(x => x.provider === provider);
                options.map((item, i) => options[i].selected = (selectedOptions.filter(x => x.text === item.text).length > 0))
            }
            obj.setState({
                selected: data,
                settingsData: [{
                    id: 0,
                    name: name,
                    description: description,
                    options: options
                }]
            })
        })

    }

    login(login) {
        this.setState({
            loading: true
        })
        var logintype = this.state.provider.logintype.toLowerCase();
        var provider = this.state.provider.id;
        var obj = this;
        if (login) {
            Post(config.domain + config.endpoints.login, {provider: provider})
            .then(function(data){
                if (logintype === "oauth") {
                    storage.set(config.keys.login, {provider: provider, logintype: logintype, state: data.state})
                    .then(() => Linking.openURL(data.url))
                }
            })
            .catch(function(){
                obj.setState({
                    badRequest: true,
                    loading: false
                })
                obj.loadList()
            })
        } else {
            storage.get(config.keys.providerToken + this.state.provider.id)
            .then(function(token) {
                return Post(config.domain + config.endpoints.logout, {token:token})
            })
            .then(function(){
                obj._logout();
            })
            .catch(function(){
                obj._logout();
            })
        }
    }

    _login(provider, token) {
        storage.set(config.keys.providerToken + provider, token);
        storage.remove(config.keys.login);

        storage.get(config.keys.bookmarks)
        .then(function(data) {
            if (data[provider] && data[provider].data.length > 0) {
                var ids = data[provider].data.map(x => x.article)
                ids = JSON.stringify(ids);
                Alert.alert(
                    config.text.bookmarkSyncTitle, 
                    config.text.bookmarkSyncDesc, [ 
                    {text: config.text.no}, 
                    {text: config.text.yes, onPress: () => 
                        Post(config.domain + config.endpoints.batchBookmark, {token: token, id:ids})
                        .then(function(){storage.remove(config.keys.bookmarks);})
                        .catch(function(){})
                    }, ] )
            }
            
        })
        this.setState({
            loading: false,
            loginmethod: false
        })
        this.loadList()
    }

    _logout() {
        var obj = this;
        storage.remove(config.keys.providerToken + obj.state.provider.id)
        this.setState({
            loginmethod: true,
            loading: false
        })
        this.loadList()
    }

    parseSelection(option) {
        option.selected = !option.selected;
        var data = this.state.settingsData[0].options;
        data.map((item, i) => item.selected = (item.text === option.text) ? option.selected : item.selected);
        var provider = this.state.provider;
        this.setState({
            settingsData: [{
                id: 0,
                options: data,
                name: provider.name,
                description: provider.description
            }]
        })
        var obj = this;
        this.parseOption(option, this.state.selected)
        .then(() => obj.state.events.emit('reloadCategories'));

    }

    parseOption(option, data) {
        var selected = data || {selected:"0", showImage: this.state.showImage, data: []}
        selected.selected = '0';
        if (typeof selected.data === 'undefined')
            selected.data = [];
        if (option.selected) {
            selected.data.push(option);
            return storage.set(config.keys.selected, selected)
        } else {
            if (selected.data.length <= 1) {
                delete selected.data;
                delete selected.selected;
                return storage.set(config.keys.selected, selected);
            }
            else {
                selected.data = selected.data.filter((x) => x.text !== option.text)
                return storage.set(config.keys.selected, selected)
            }
        }
    }

    renderOptions(options) {
        var obj = this;
        return options.map(function(option, i){ 
            return (
                <TouchableWithoutFeedback key={i} onPress={() => obj.parseSelection(option)}>
                    <View style={[style.optionItem, option.selected && style.optionActive]}>
                        <Text style={style.optionName}>{option.text}</Text>
                    </View>
                </TouchableWithoutFeedback>
            );
        })
    }

    renderRow(item, login, method, badRequest) {
        return (
            <View style={style.settingsContainer}>
                <TouchableWithoutFeedback onPress={() => this.props.navigation.goBack()}>
                    <Icon name="arrow-left" size={35} color="#663399" />
                </TouchableWithoutFeedback>

                {login &&
                    <TouchableWithoutFeedback onPress={() => this.login(method)}>
                        <View style={style.option}>
                            {method ? (
                                <Icon name="sign-in" size={35} color="#663399" />
                            ) : (
                                <Icon name="sign-out" size={35} color="#663399" />
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                }

                {badRequest &&
                    <View style={style.notificationWrap}>
                        <Text style={style.notification}>¯\_(ツ)_/¯</Text>
                        <Text style={style.notification}>{config.text.badrequest}</Text>
                    </View>
                }

                <Text style={style.providerName}>{item.name}</Text>
                <Text style={style.description}>{item.description}</Text>
                <Text style={style.feedNotification}>{config.text.category}</Text>
                <View style={style.options}>
                    
                    {this.renderOptions(item.options)}
                </View>

            </View>
        );
    }

    render() {
        return (
            <View style={style.container}>
                <FlatList
                    data={this.state.settingsData}
                    renderItem={({item}) => this.renderRow(item, this.state.login, this.state.loginmethod, this.state.badRequest) }
                    keyExtractor={(item) => item.id} />
                {this.state.loading &&
                    <ActivityIndicator size="large" style={style.storageIndicator} color="black" />
                }
            </View>
        );
    }
}

export default Settings;
