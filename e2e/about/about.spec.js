'use strict';

describe('Main View', function() {
  var page;

  beforeEach(function() {
    browser.get('/about');
    page = require('./about.po');
  });

  it('should include page title with correct data', function() {
    expect(page.titleEl.getText()).toBe('About');
  });
});
