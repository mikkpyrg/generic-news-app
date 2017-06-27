import React, { Component } from 'react';
import { TabNavigator, StackNavigator } from 'react-navigation';

import Art from './components/Art';
import Settings from './components/Settings';
import Provider from './components/Provider';
import ArtStorage from './components/ArtStorage';
import ArtList from './components/ArtList';
import style from './components/Style';
import Icon from 'react-native-vector-icons/FontAwesome';

const SettingsStack = StackNavigator({
    General: {
        screen: Settings
    },
    Provider: {
        screen: Provider
    },
},{
    headerMode: "none",
    initialRouteName: 'General'
});

const MainStack = StackNavigator({
    ArtList: {
        screen: ArtList
    },
    Art: {
        screen: Art
    },
},{
    headerMode: "none",
    initialRouteName: 'ArtList'
});

const Tabs = TabNavigator({
    Settings: {
        screen: SettingsStack,
        navigationOptions: {
            tabBarIcon: ({focused}) => (
                <Icon
                    color={focused ? "#913D88" : '#95A5A6'}
                    name="wrench"
                    size={25} />
            )
        }
    },
    Main: {
        screen: MainStack,
        navigationOptions: {
            tabBarIcon: ({focused}) => (
                <Icon
                    color={focused ? "#03A678" : '#95A5A6'}
                    name="home"
                    size={25} />
            )
        }
    },
    ArtStorage: {
        screen: ArtStorage,
        navigationOptions: {
            tabBarIcon: ({focused}) => (
                <Icon
                    color={focused ? "#F2784B" : '#95A5A6'}
                    name="archive"
                    size={25} />
            )
        }
    }
},
{
    initialRouteName: 'Main', 
    tabBarOptions: {
        showIcon: true,
        showLabel: false,
        style: {
            backgroundColor: '#ECF0F1'
        },
        indicatorStyle: {
            backgroundColor: '#22313F'
        }
    }
});

export default Tabs;
