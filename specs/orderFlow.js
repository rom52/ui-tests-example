'use strict'
const generate = require("../utils/generateMass");

//importar classes de page object
const HomePage                  = require('../pages/homePage.js');
const ProductPage               = require('../pages/productPage.js');
const CartPage                  = require('../pages/cartPage.js');
const LoginPage                 = require('../pages/loginPage.js');
const CreateAccountPage         = require('../pages/createAccountPage.js');
const AddressesPage             = require('../pages/addressesPage.js');
const ShippingPage              = require('../pages/shippingPage.js');
const PaymentPage               = require('../pages/paymentPage.js');
const OrderConfirmationPage     = require('../pages/orderConfirmationPage.js');

let email = generate.email();    

describe('Cenário de fluxo de pedido', ()=> {

//instanciar classes a serem utilizadas
const homePage              = new HomePage();
const productPage           = new ProductPage();
const cartPage              = new CartPage();
const loginPage             = new LoginPage();
const createAccountPage     = new CreateAccountPage();
const addressesPage         = new AddressesPage();
const shippingPage          = new ShippingPage();
const paymentPage           = new PaymentPage();
const orderConfirmationPage = new OrderConfirmationPage();

    it('Dado que estou na home page', ()=>{
        homePage.visit();  
    });

    it('Quando eu seleciono um produto e realizado um novo cadastro e prosigo até o checkout', ()=>{
        homePage.searchProductToPageProduct("Dress");
        productPage.clickProceedToCheckout();
        cartPage.clickProceedToCheckout();
        loginPage.setEmailAndClickCreateAccount(email);
        createAccountPage.fillForm();
        addressesPage.clickProceedToCheckout();
        shippingPage.clickAproveTermAndClickProceedToCheckout();
        paymentPage.selectPaymentOptionBankAndClickConfirmMyOrder();
    });

    it('Enão eu visualizo a mensagem Your order on My Store is complete.', ()=>{
        orderConfirmationPage.validMessage("Your order on My Store is complete.");
    });
});