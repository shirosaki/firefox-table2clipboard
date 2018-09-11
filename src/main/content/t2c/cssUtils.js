/*
# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Initial Developer of the Original Code is
# Davide Ficano.
# Portions created by the Initial Developer are Copyright (C) 2009
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#   Davide Ficano <davide.ficano@gmail.com>
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****
*/

if (typeof(table2clipboard) == "undefined") {
    var table2clipboard = {};
}

if (typeof(table2clipboard.css) == "undefined") {
    table2clipboard.css = {};
}

table2clipboard.css.utils = {};

(function() {

var allRules = null;
var getMatchedCSSRules = (el, css = el.ownerDocument.styleSheets) => {
    if (allRules === null) {
        allRules = [].concat(...[...css].map(s => [...s.cssRules||[]]));
    }
    return allRules.filter(r => el.matches(r.selectorText));
};

/**
 * Fill the passed hashMap with selectors and associated style
 * The hashMap value is set to true and it is not meaningful
 * @param node the DOM node to inspect
 * @param hashMap the hash array object to fill, selector keys already
 * present are overwritten by design
 * @returns the map itself
 */
this.addStyles = function(node, hashMap) {
    if (node && hashMap) {
        getMatchedCSSRules(node).forEach((r) => {
            hashMap[r.cssText] = true;
        });
    }

    return hashMap;
}
}).apply(table2clipboard.css.utils);
