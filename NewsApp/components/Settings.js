import React, { Component } from 'react';
import { View, Text, Switch, FlatList, TouchableWithoutFeedback} from 'react-native';
import storage from 'react-native-modest-storage';
import config from '../config.json';
import style from './Style';
import {Get} from './Request';
class Settings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            events: this.props.screenProps.events,
            showImage: true,
            settingsData: [],
            providers: [],
            connectedToServer: false,
            badRequest: false
        };
        this.dailyCheck = this.dailyCheck.bind(this);
        this.loadList = this.loadList.bind(this);
        this.changeImage = this.changeImage.bind(this);
        this.renderProviders = this.renderProviders.bind(this);
        this.renderRow = this.renderRow.bind(this);
        var obj = this;
        //storage.clear();
        storage.remove(config.keys.lastUpdate);
        storage.remove(config.keys.selected);
        storage.get(config.keys.providers)
        .then(function(data){
            if (!obj.state.connectedToServer && data) {
                obj.setState({
                    providers: data
                })
                obj.loadList();
            }
        })
        storage.get(config.keys.lastUpdate)
        .then(function(data){
            if (data === null) {
                obj.dailyCheck();
                return false;
            }
            var present = new Date();
            var diff = date - present.valueOf();
            if (diff > 86000000) {
                obj.dailyCheck();
                storage.set(config.keys.lastUpdate, persent.valueOf());
            }
        })
        storage.get(config.keys.selected)
        .then(function(data){
            if (data !== null && typeof data.showImage !== "undefined")
                obj.setState({
                    showImage: data.showImage
                })
            else {
                data = data || {};
                data.showImage = true;
                storage.set(config.keys.selected, data)
            }
            obj.setState({
                showImage: data.showImage
            })
            obj.state.events.emit("showImage", data.showImage);
            obj.loadList();
        })
    }

    dailyCheck() {
        var obj = this;
        this.setState({
            badRequest: false
        })
        Get(config.domain + config.endpoints.providers)
        .then(function(data) {
            storage.set(config.keys.providers, data.providers)
            obj.setState({
                providers: data.providers
            })
            return data.providers;
        })
        .then(function(providers) {
            // reauth all the folks

            return storage.get(config.keys.selected)
            .then(function(data) {
                if (data === null)
                    return null;
                tabs = data.data || [];
                tabs = tabs.filter((item, i) => obj.providerContainsTab(providers, item))
                data.data = tabs;
                if (tabs.length > 0) {
                    if (data.selected && parseInt(data.selected) >= tabs.length)
                        data.selected = '0';
                } else {
                    delete data.selected;
                    delete data.data;
                }
                return storage.set(config.keys.selected, data);
            })
        })
        .then(function() {
            obj.loadList();
            obj.state.events.emit('reloadCategories');
        })
        .catch(function() {
            if (obj.state.providers.length === 0) {
                obj.setState({
                    badRequest: true
                })
                obj.loadList();
            }
        })
    }

    providerContainsTab(providers, item) {
        var provider = providers.find(x => x.id === item.provider)
        if (typeof provider === "undefined")
            return false
        if (typeof item.category === "undefined")
            return true;
        var answer = provider.categories.split(',').find(x => x === item.category);
        if (typeof answer === "undefined")
            return false;
        else
            return true;
    }

    loadList() {
        this.setState({
            settingsData: [{
                id: 0,
                providers: this.state.providers
            }]
        })
    }

    changeImage(value) {
        this.setState({
            showImage: value
        })
        this.loadList();
        this.state.events.emit('showImage', value);
    }

    renderRow(item, showImage, badrequest) {
        return (
            <View style={style.settingsContainer}>
                <View style={style.option}>
                    <Text style={style.optionText}>{config.text.showImage}</Text>
                    <Switch style={style.optionAction} onValueChange={(value) => this.changeImage(value)}
                    value={showImage} />
                </View>
                <Text style={style.feedNotification}>{config.text.feed}</Text>
                <View style={style.options}>
                    
                    {this.renderProviders(item.providers, showImage)}
                </View>
                {badrequest &&
                    <View style={style.notificationWrap}>
                        <Text style={style.notification}>¯\_(ツ)_/¯</Text>
                        <Text style={style.notification}>{config.text.badrequest}</Text>
                        <TouchableWithoutFeedback onPress={() => this.dailyCheck()}>
                            <View style={style.loadMore}>
                                <Text style={style.loadMoreText}>{config.text.tryagain.toUpperCase()}</Text>
                            </View>
                        </TouchableWithoutFeedback>
                    </View> 
                }
            </View>
        );
    }

    renderProviders(providers, showImage) {
        var obj = this;
        return providers.map(function(provider, i){
            return (
                <TouchableWithoutFeedback key={i} onPress={() => obj.props.navigation.navigate('Provider', {provider: provider, showImage: showImage})}>
                    <View style={style.optionItem}>
                        <Text style={style.optionName}>{provider.name}</Text>
                    </View>
                </TouchableWithoutFeedback>
            );
        })
    }

    render() {
        return (
            <View style={style.container}>
                <FlatList
                    data={this.state.settingsData}
                    renderItem={({item}) => this.renderRow(item, this.state.showImage, this.state.badRequest) }
                    keyExtractor={(item) => item.id} />
            </View>
        );
    }
}

export default Settings;
