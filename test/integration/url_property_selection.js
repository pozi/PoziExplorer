var expect = require("chai").expect,
    wd = require("wd");

describe("URL property selection", function(){
  var browser;

  beforeEach(function() {
    browser = wd.remote('http://localhost:8192/wd/hub').chain().init();
  });
  afterEach(function() {
    browser.quit();
  });

  it("should show the correct address", function(done){
    var detailsTab = '//div[@id="gtAccordion"]//div[@id="attributeAcc"]';
    var addressValueDiv = detailsTab + '//td/div[text()="Address"]/../../td[last()]/div';

    browser
      .get("http://localhost:9090/?config=cardinia&property=3755100500")
      .waitForElementByXPath(detailsTab, 10000)
      .elementByXPath(addressValueDiv, function(err, element) {
        element.text(function(err, text) {
          expect(text).to.equal('11 SAVAGE STREET PAKENHAM 3810');
          done();
        });
      });
    
  });

});

