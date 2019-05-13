const protractorHelper = require("protractor-helper");
const generate = require("../utils/generateMass");

//elemento productPage
const buttonProceedToCheckout = $(".button-container  .btn.button-medium");

class productPage{
    constructor(){
    }

    clickProceedToCheckout(){
        protractorHelper.clickWhenClickable(buttonProceedToCheckout, 10000);
    }   

}
module.exports = productPage;