const protractorHelper = require("protractor-helper");

//elementos
const inputSearchProduct = $("#search_query_top");
const buttonSearchProduct = $("[name='submit_search']");
const gridProduct = $$(".product_list.grid.row li").first();
const buttonLinkView = $$(".button.lnk_view").first();
const buttonAddToCart = $("#add_to_cart button[name='Submit']");

class homePage{
    constructor(){
    }

    visit(){browser.get("");}
    
    searchProductToPageProduct(product){     
    
        protractorHelper.waitForElementVisibility(inputSearchProduct, 5000, "Não localizado campo busca produto");
        protractorHelper.fillFieldWithTextWhenVisible(inputSearchProduct, product, 5000);
        protractorHelper.clickWhenClickable(buttonSearchProduct);
        protractorHelper.clickWhenClickable(gridProduct);
        protractorHelper.clickWhenClickable(buttonLinkView);
        protractorHelper.clickWhenClickable(buttonAddToCart, 10000);
    }

   

   }
   module.exports = homePage;