const protractorHelper = require("protractor-helper");
const generate = require("../utils/generateMass");


//elementos createAccountPage
const radioMr = $("label[for='id_gender1']");
const inputFirstName = $("#customer_firstname");
const inputLastName = $("#customer_lastname");
const inputEmail = $("#email");
const inputPassword = $("#passwd");
const inputDayBirth = $("#days [value='10']");
const inputMonthBirth = $("#months [value='10']");
const inputYearBirth = $("#years [value='1980']");
const inputFirstNameAdress = $("#firstname");
const inputLastNameAdress = $("#lastname");
const inputAdress = $("#address1");
const inputAdress2 = $("#address2");

const inputCity = $("#city");
const inputState = $("#id_state [value='1']");
const inputPostcode = $("#postcode");
const inputCountry = $("#id_country [value='1']");
const inputAPhoneMobile = $("#phone_mobile");
const buttonRegister = $("#submitAccount");

class createAccountPage{
    constructor(){
    }

    fillForm(){
        protractorHelper.clickWhenClickable(radioMr, 10000);
        protractorHelper.fillFieldWithTextWhenVisible(inputFirstName, "Teste", 10000);
        protractorHelper.fillFieldWithTextWhenVisible(inputLastName, "Auto", 10000);
        //protractorHelper.fillFieldWithTextWhenVisible(inputEmail, email, 10000);
        protractorHelper.fillFieldWithTextWhenVisible(inputPassword, "123456", 10000);
        protractorHelper.clickWhenClickable(inputDayBirth, 10000);
        protractorHelper.clickWhenClickable(inputMonthBirth, 10000);
        protractorHelper.clickWhenClickable(inputYearBirth, 10000);    
        protractorHelper.fillFieldWithTextWhenVisible(inputFirstNameAdress, "Testa Endereco", 10000);
        protractorHelper.fillFieldWithTextWhenVisible(inputLastNameAdress, "Teste Endereco", 10000);
        protractorHelper.fillFieldWithTextWhenVisible(inputAdress, "Rua Teste, 123", 10000);
        protractorHelper.fillFieldWithTextWhenVisible(inputAdress2, "apto 1", 10000);
        protractorHelper.fillFieldWithTextWhenVisible(inputCity, "Sao Paulo", 10000);
        protractorHelper.clickWhenClickable(inputState, 10000);
        protractorHelper.fillFieldWithTextWhenVisible(inputPostcode, "12345", 10000);
        //protractorHelper.clickWhenClickable(inputCountry, 10000);
        protractorHelper.fillFieldWithTextWhenVisible(inputAPhoneMobile, "1191111111", 10000);
        protractorHelper.clickWhenClickable(buttonRegister, 10000);
    }
}
module.exports = createAccountPage;