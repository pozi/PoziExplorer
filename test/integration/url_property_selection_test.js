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

  it("should work", function(done){

    browser
    .get("http://www.google.com")
    .title(function(err, title) {
      expect(title).to.equal("Googz");
    });
    
  });

});

