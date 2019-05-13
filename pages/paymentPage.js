const protractorHelper = require("protractor-helper");
const generate = require("../utils/generateMass");

//paymentPage
const tableCartSumary = $("#cart_summary");
const paymentOptionBank = $("#HOOK_PAYMENT .bankwire");
const paymentOptionCheque = $("#HOOK_PAYMENT .cheque");
const buttonConfirmMyOrder = $(".cart_navigation.clearfix .button-medium");

class paymentPage{
    constructor(){
    }

    
    selectPaymentOptionBankAndClickConfirmMyOrder(){
        protractorHelper.waitForElementVisibility(tableCartSumary, 15000);  
        protractorHelper.clickWhenClickable(paymentOptionBank, 3000);
        protractorHelper.clickWhenClickable(buttonConfirmMyOrder, 10000);
    }
  
}
module.exports = paymentPage;