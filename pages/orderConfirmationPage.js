const protractorHelper = require("protractor-helper");
const generate = require("../utils/generateMass");

//orderConfirmationPage
const messageOrderConfirmation = $(".box .dark");

class orderConfirmationPage{
    constructor(){
    }


    validMessage(message){
      protractorHelper.waitForElementVisibility(messageOrderConfirmation, 15000);
      expect(messageOrderConfirmation.getText()).toContain(message);
    }
    
}
module.exports = orderConfirmationPage;