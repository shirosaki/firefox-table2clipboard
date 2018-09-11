/**
 * Author   : Davide Ficano
 * Date     : 26-Dec-05
 */

if (typeof(table2clipboard) == "undefined") {
    var table2clipboard = {};
}

if (typeof(table2clipboard.common) == "undefined") {
    table2clipboard.common = {};
}

(function() {
// Under mozilla composer <stringbundleset id="stringbundleset"> isn't available
// so we use nsIStringBundleService

this.isOSWin = function() {
    return top.window.navigator.platform.indexOf("Win") >= 0;
}

this.newLine = table2clipboard.common.isOSWin() ? "\r\n" : "\n";

this.getLocalizedMessage = function(msg) {
    return browser.i18n.getMessage(msg);
}

this.getFormattedMessage = function(msg, ar) {
    return browser.i18n.getMessage(msg, ar);
}

this.log = function(message) {
    console.log(message);
}

this.htmlEncode = function(s, isAttValue, isCanonical) {
    if (typeof (isAttValue) == "undefined" || isAttValue == null) {
        isAttValue = true;
    }
    if (typeof (isCanonical) == "undefined" || isCanonical == null) {
        isCanonical = false;
    }
    var len = s ? s.length : 0;
    var str = "";
    for (var i = 0; i < len; i++) {
        str += this.getEntity(s.charAt(i), isAttValue, isCanonical);
    }
    return str;
}

this.getEntity = function(ch, isAttValue, isCanonical) {
    switch (ch) {
        case '\xA0':
            return "&nbsp;";
        case '<':
            return "&lt;";
        case '>':
            return "&gt;";
        case '&':
            return "&amp;";
        case '"':
            // A '"' that appears in character data
            // does not need to be escaped.
            return isAttValue ? "&quot;" : "\"";
        case '\r':
            // If CR is part of the document's content, it
            // must not be printed as a literal otherwise
            // it would be normalized to LF when the document
            // is reparsed.
            return "&#xD;";
        case '\n':
            if (isCanonical) {
                return "&#xA;";
            }
            // else, default print char
        default:
            return ch;
    }
    // make happy lint
    return ch;
}

this.isTargetATextBox = function(node) {
    if (!node || node.nodeType != Node.ELEMENT_NODE)
        return false;

    if (node.nodeName.toUpperCase() == "INPUT") {
        var attrib = "";
        var type = node.getAttribute("type");

        if (type)
            attrib = type.toUpperCase();

        return( (attrib != "IMAGE") &&
                (attrib != "CHECKBOX") &&
                (attrib != "RADIO") &&
                (attrib != "SUBMIT") &&
                (attrib != "RESET") &&
                (attrib != "FILE") &&
                (attrib != "HIDDEN") &&
                (attrib != "RESET") &&
                (attrib != "BUTTON") &&
                (attrib != "PASSWORD") );
    } else  {
        return(node.nodeName.toUpperCase() == "TEXTAREA");
    }
}

this.getTextNodeContent = function(node) {
    var str = "";
    var nl = node.childNodes;

    for (var i = 0; i < nl.length; i++) {
        if (nl[i].nodeType == Node.ELEMENT_NODE) {
            var style = nl[i].ownerDocument.defaultView.getComputedStyle(nl[i], null);
            if (style.getPropertyValue("display") == "none") {
                continue;
            }
            // preserve newlines
            if (nl[i].nodeName.toUpperCase() == "BR") {
                str += table2clipboard.common.newLine;
            }
        }
        if (nl[i].nodeType == Node.TEXT_NODE) {
            str += nl[i].nodeValue;
        } else if (this.isTargetATextBox(nl[i])) {
            // replace all new lines/carriage returns with a single blank space
            str += nl[i].value.replace(/(\r\n|\r|\n)+/g, " ");
            // ignore children
            // textareas can contain initial text as node
            continue;
        }
        if (nl[i].hasChildNodes()) {
            str += this.getTextNodeContent(nl[i]);
        }
    }
    return str;
}

this.trim = function(str) {
    var retStr = "";

    if (str) {
        var re = /^[ \s]+/g;
        retStr = str.replace(re, "");
        re = /[ \s]+$/g;
        retStr = retStr.replace(re, "");

        // remove inner tabs
        var re = /\t+/g;
        retStr = retStr.replace(re, "");
    }
    return retStr;
}

this.logException = function(ex, msg) {
    var exMsg = ex;

    if ("fileName" in ex) {
        exMsg = ex.fileName + "(" + ex.lineNumber + ") : "
            + ex.name + " - " + ex.message + "\n\n"
            + ex.stack;
    }
    if (msg) {
        exMsg = msg + "\n" + exMsg;
    }
    this.log(exMsg);
}

this.makeAbsoluteUrl = function(base, relative) {
    return new URL(relative, base).href;
}
}).apply(table2clipboard.common);
