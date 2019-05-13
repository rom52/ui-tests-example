const protractorHelper = require("protractor-helper");
const generate = require("../utils/generateMass");

//shippingPage
const tableResumeDelivery = $(".resume.table.table-bordered");
const checkboxTerms = $("[for='cgv']");
const buttonProceedToCheckoutShipping = $("[name='processCarrier']");

class shippingPage{
    constructor(){
    }
    
    clickAproveTermAndClickProceedToCheckout(){
        protractorHelper.waitForElementVisibility(tableResumeDelivery, 15000);
        protractorHelper.clickWhenClickable(checkboxTerms, 8000);
        protractorHelper.clickWhenClickable(buttonProceedToCheckoutShipping, 3000);
    }
}
module.exports = shippingPage;