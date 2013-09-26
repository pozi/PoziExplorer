
exports.ensureVarsSet = function() {
  if (!("POZIEXPLORER_TEST_WEBDRIVER" in process.env) || !("POZIEXPLORER_TEST_SUBJECT" in process.env)) {
    throw new Error("Env vars not set!");
  }
};

exports.timeout_for = function(thing) {
  typeof thing.runnable === "Function" ? thing.runnable().timeout() : thing.timeout();
}

