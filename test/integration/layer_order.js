var expect = require("chai").expect,
    wd = require("wd"),
    helpers = require("../helpers"),
    _ = require("underscore");

helpers.ensureVarsSet();

describe("Layer order", function(){
  var browser;
  beforeEach(function() { browser = wd.remote(process.env.POZIEXPLORER_TEST_WEBDRIVER).chain().init(); });
  afterEach(function() { browser.quit(); });

  it("should not have layers of any other group under a background layer", function(done){
    var emptyBasemapInLayerTree = '//li[@class="x-tree-node"]/div/a/span[text()="None"]';

    browser
      .get(process.env.POZIEXPLORER_TEST_SUBJECT + "?config=mitchell")
      .waitForElementByXPath(emptyBasemapInLayerTree, helpers.timeout_for(this))
      .safeEval('_(app.mapPanel.layers.data.items).map(function(i){ return i.data.group; })', function(err, result) {
        expect(err).to.be.a('null');
        var groups = _(result).compact();
        var startToLastBackground = _(groups).first(_(groups).lastIndexOf('background')+1);
        var groupsUnderABackgroundLayer = _(startToLastBackground).chain().without('background').uniq().value();
        expect(groupsUnderABackgroundLayer).to.be.empty();
        done();
      });
    
  });

});
