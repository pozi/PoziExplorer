var expect = require("chai").expect,
    wd = require("wd");

if (!("POZIEXPLORER_TEST_WEBDRIVER" in process.env) || !("POZIEXPLORER_TEST_SUBJECT" in process.env)) {
  throw new Error("Env vars not set!");
}

describe("URL property selection", function(){
  var browser;
  var timeout_for = function(thing) { thing.runnable().timeout(); }

  beforeEach(function() {
    browser = wd.remote(process.env.POZIEXPLORER_TEST_WEBDRIVER).chain().init();
  });
  afterEach(function() {
    browser.quit();
  });

  it("should show the correct address", function(done){
    var detailsTab = '//div[@id="gtAccordion"]//div[@id="attributeAcc"]';
    var addressValueDiv = detailsTab + '//td/div[text()="Address"]/../../td[last()]/div';

    browser
      .get(process.env.POZIEXPLORER_TEST_SUBJECT + "?config=cardinia&property=3755100500")
      .waitForElementByXPath(detailsTab, timeout_for(this))
      .waitForElementByXPath(addressValueDiv, timeout_for(this))
      .elementByXPath(addressValueDiv, function(err, element) {
        expect(err).to.be.a('null');
        element.text(function(err, text) {
          expect(err).to.be.a('null');
          expect(text).to.equal('11 SAVAGE STREET PAKENHAM 3810');
          done();
        });
      });
    
  });

});

