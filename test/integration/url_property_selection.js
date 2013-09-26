var expect = require("chai").expect,
    wd = require("wd"),
    _ = require("underscore");

if (!("POZIEXPLORER_TEST_WEBDRIVER" in process.env) || !("POZIEXPLORER_TEST_SUBJECT" in process.env)) {
  throw new Error("Env vars not set!");
}
var timeout_for = function(thing) { typeof thing.runnable === "Function" ? thing.runnable().timeout() : thing.timeout(); }

describe("URL property selection", function(){
  var browser;

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

describe("Layer presentation order", function(){
  var browser;

  beforeEach(function() {
    browser = wd.remote(process.env.POZIEXPLORER_TEST_WEBDRIVER).chain().init();
  });
  afterEach(function() {
    browser.quit();
  });

  it("should put the background layers before layers of any other group", function(done){
    var emptyBasemapInLayerTree = '//li[@class="x-tree-node"]/div/a/span[text()="None"]';

    browser
      .get(process.env.POZIEXPLORER_TEST_SUBJECT + "?config=mitchell")
      .waitForElementByXPath(emptyBasemapInLayerTree, timeout_for(this))
      .waitForConditionInBrowser('try { typeof app.mapPanel.layers.data.items === \'object\' } catch(e) { false }')
      .safeEval('_(app.mapPanel.layers.data.items).map(function(i){ return i.data.group; })', function(err, result) {
        expect(err).to.be.a('null');
        var layersWithGroup = _(result).compact();
        var startToLastBackground = _(layersWithGroup).first(_(layersWithGroup).lastIndexOf('background')+1);
        expect(_(startToLastBackground).uniq()).to.have.length(1);
        done();
      });
    
  });

});
