const protractorHelper = require("protractor-helper");
const generate = require("../utils/generateMass");

//elementos cartPage
const buttonProceedToCheckoutCart = $(".cart_navigation.clearfix a.button-medium");

class cartPage{
    constructor(){
    }

    clickProceedToCheckout(){
        protractorHelper.clickWhenClickable(buttonProceedToCheckoutCart, 10000);
    }
    

}
module.exports = cartPage;