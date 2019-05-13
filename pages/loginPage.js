const protractorHelper = require("protractor-helper");
const generate = require("../utils/generateMass");

//elementos loginPage
const inputEmailCreate = $("input#email_create");
const buttonCreateAnAccount = $("#SubmitCreate");

class loginPage{
    constructor(){
    }

    setEmailAndClickCreateAccount(email){
        protractorHelper.fillFieldWithTextWhenVisible(inputEmailCreate, email, 10000);
        protractorHelper.clickWhenClickable(buttonCreateAnAccount, 10000);   
    }


}
module.exports = loginPage;