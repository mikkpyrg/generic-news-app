import {StyleSheet} from 'react-native';

export default styles = StyleSheet.create({
    container: {
        backgroundColor: "#EEEEEE",
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start',
    },
    text: {
        marginLeft: 12,
        fontSize: 16,
    },
    photo: {
        height: 40,
        width: 40,
        borderRadius: 20,
    },
    tabs: {
        maxHeight: 40,
        minHeight: 40,
        backgroundColor: '#ececec'
    },
    tab: {
        padding: 10,
        fontSize: 16
    },
    tabActive: {
        color: "#03A678"
    },
    padTop: {
        paddingTop: 15
    },
    padBottom: {
        paddingBottom: 15
    },
    padText: {
        paddingRight: 5
    },
    notificationWrap: {
        paddingTop: 15,
        flex: 1,
        flexDirection: "column",
        alignItems: "center"
    },
    notification: {
        textAlign: 'center',
        paddingBottom: 15
    },
    listitem: {
        flex: 1,
        flexDirection: 'row',
        minHeight: 150,
        marginTop: 15,
        paddingLeft: 10,
        paddingRight: 10
    },
    listpicture: {
        flex: 0.5
    },
    listcontent: {
        flex: 0.5
    },
    listcontentWithoutImage: {
        flex: 1,
        justifyContent: "space-between",
        paddingLeft: 10
    },
    listtitle: {
        fontSize: 20,
        color: '#333',
        paddingBottom: 10
    },
    listcategory: {
        paddingBottom: 10,
    },
    loadMore: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center'
    },
    loadMoreText: {
        backgroundColor: '#89C4F4',
        textAlign: 'center',
        width: 200,
        padding: 12,
        borderRadius: 10,
        marginBottom: 25
    },
    loadMoreIndicator: {
        marginBottom: 25,
        marginTop: 20
    },
    tabIcon: {
        width: 20,
        height: 20
    },
    artPlugin: {
        flexDirection: 'row',
        justifyContent: 'center'
    },
    artPluginWrap: {
        paddingLeft: 10,
        paddingRight: 10,
        minHeight: 50
    },
    likeIndicator: {
        paddingTop: 10,
        width: 29
    },
    downloadIndicator: {
        paddingTop: 10,
        width: 43
    },
    extraTabs: {
        paddingTop: 10,
        flex: 1,
        maxHeight: 60,
        minHeight: 60,
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20
    },
    extraTab: {
        paddingLeft: 15,
        paddingRight: 15
    },
    storageIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    bookmarkGroupTitle: {
        fontSize: 24,
        textAlign: 'center',
        paddingTop: 10,
        paddingBottom: 10
    },
    bookmarkContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: "space-between",
    },
    bookmarkItem: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: 'center',
        backgroundColor: '#D2D7D3',
        padding: 10,
        margin: 10,
        minHeight: 50
    },
    bookmarkTitle: {
        flex: 1
    },
    confirmation: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: 'center',
        maxWidth: 500,
        padding: 10
    },
    confirmationButtons: {
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20
    },
    articleWrap: {
        padding: 10,
        flex: 1,
        flexDirection: 'column',
    },
    articleTitle: {
        fontSize: 24,
        color: '#333',
        marginBottom: 10
    },
    articleSummary: {
        color: '#333',
        fontWeight: '500',
        marginBottom: 10
    },
    mainpicture: {
        flex: 1
    },
    articleInfo: {
        paddingTop: 15,
        flex: 1,
        flexDirection: 'row',
        minHeight: 33,
        maxHeight: 33
    },
    articleNav: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 10
    },
    articleNavLeft: {
        marginRight: 10
    },
    articleNavRight: {
        marginLeft: 6
    },
    settingsContainer: {
        padding: 20
    },
    option: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    optionText: {
        marginRight: 15
    },
    feedNotification: {
        marginTop: 15,
        textAlign: 'center',
        marginBottom: 10
    },
    options: {
        flexDirection:'row',
        flexWrap:'wrap'
    },
    optionName: {
        fontSize: 20,
        color: '#333'
    },
    optionItem: {
        padding: 15,
        marginRight: 10,
        marginTop: 10,
        backgroundColor: "#AEA8D3",
    },
    optionActive: {
        backgroundColor: "#90C695",
    },
    providerName: {
        fontSize: 30,
        marginBottom: 10,
        textAlign: 'center',
        color: '#333'
    },
    description: {
        marginBottom: 10,
        textAlign: 'center',
        color: '#333'
    },
    a: {color: '#007AFF'},
    b: {color:'#333', fontWeight: '500'},
    i: {color:'#333', fontStyle: 'italic'},
    strong: {color:'#333', fontWeight: '500'},
    p: {color:'#333'},
    h1: {color:'#333', fontWeight: '500', fontSize: 36},
    h2: {color:'#333', fontWeight: '500', fontSize: 30},
    h3: {color:'#333', fontWeight: '500', fontSize: 24},
    h4: {color:'#333', fontWeight: '500', fontSize: 18},
    h5: {color:'#333', fontWeight: '500', fontSize: 14},
    h6: {color:'#333', fontWeight: '500', fontSize: 12},
});