var expect = require("chai").expect,
    wd = require("wd"),
    helpers = require("../helpers"),
    _ = require("underscore");

helpers.ensureVarsSet();

describe("Layer order", function(){
  var browser;
  beforeEach(function() { browser = wd.remote(process.env.POZIEXPLORER_TEST_WEBDRIVER).chain().init(); });
  afterEach(function() { browser.quit(); });

  it("should put the background layers before layers of any other group", function(done){
    var emptyBasemapInLayerTree = '//li[@class="x-tree-node"]/div/a/span[text()="None"]';

    browser
      .get(process.env.POZIEXPLORER_TEST_SUBJECT + "?config=mitchell")
      .waitForElementByXPath(emptyBasemapInLayerTree, helpers.timeout_for(this))
      .safeEval('_(app.mapPanel.layers.data.items).map(function(i){ return i.data.group; })', function(err, result) {
        expect(err).to.be.a('null');
        var layersWithGroup = _(result).compact();
        var startToLastBackground = _(layersWithGroup).first(_(layersWithGroup).lastIndexOf('background')+1);
        expect(_(startToLastBackground).uniq()).to.have.length(1);
        done();
      });
    
  });

});
