'use strict'
var HtmlReporter = require('protractor-beautiful-reporter');

module.exports.config = {

directConnect: true,
capabilities: {
     'browserName': 'chrome',
    // chromeOptions: {
    //     args: [ "--headless", "--disable-gpu", "--window-size=800x600" ]
    //   }
    //'browserName': 'firefox',
},
  
specs: ['specs/*.js'],
getPageTimeout: 120000,
baseUrl: 'http://automationpractice.com/index.php?',
jasmineNodeOpts: { 
showColors: true ,
defaultTimeoutInterval: 120000,
isVerbose: true
},

    onPrepare: function() {
    browser.ignoreSynchronization = true;
    browser.driver.manage().window().maximize();
    jasmine.getEnv().addReporter(new HtmlReporter({
    baseDirectory: 'tmp/screenshots'
    }).getJasmine2Reporter());
 }
};







