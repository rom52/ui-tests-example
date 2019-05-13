const protractorHelper = require("protractor-helper");
const generate = require("../utils/generateMass");

//elementos addressesPage
const buttonProceedToCheckoutAddresses = $("[name='processAddress']");


class addressesPage{
    constructor(){
    }

    clickProceedToCheckout(){
      protractorHelper.clickWhenClickable(buttonProceedToCheckoutAddresses, 10000);
    }
}
module.exports = addressesPage;