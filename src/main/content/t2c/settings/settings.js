/**
 * Author: Davide Ficano
 * Date  : 26-Dec-05
 */
var gTable2ClipSettings = {
    onLoad : function() {
        var labels = document.querySelectorAll('*[data-label]');
        for (var i = 0; i < labels.length; i++) {
            labels[i].textContent = browser.i18n.getMessage(labels[i].dataset.label);
        }

        var tooltips = document.querySelectorAll('*[data-tooltip]');
        for (var i = 0; i < tooltips.length; i++) {
            tooltips[i].title = browser.i18n.getMessage(tooltips[i].dataset.tooltip);
        }

        var tabs = document.querySelector('.tabs');
        tabs.addEventListener('click', (event) => {
            if (!event.target.parentNode.classList.contains('tabs')) {
                return;
            }
            var tabs = document.querySelectorAll('.tabs > div');
            var contents = document.querySelectorAll('.tab-contents > div');
            for (var i = 0; i < tabs.length; i++) {
                var tab = tabs[i];
                if (tab === event.target) {
                    tab.classList.add('active');
                    contents[i].classList.add('active');
                } else {
                    tab.classList.remove('active');
                    contents[i].classList.remove('active');
                }
            }
        });

        document.querySelector('.row-sep [data-label="menu.special.tab"]')
        .addEventListener('click', () => {
            gTable2ClipSettings.insertSpecial('rowSep', 'tab');
        });
        document.querySelector('.row-sep [data-label="menu.special.newline"]')
        .addEventListener('click', () => {
            gTable2ClipSettings.insertSpecial('rowSep', 'newline');
        });
        document.querySelector('.column-sep [data-label="menu.special.tab"]')
        .addEventListener('click', () => {
            gTable2ClipSettings.insertSpecial('columnSep', 'tab');
        });
        document.querySelector('.column-sep [data-label="menu.special.newline"]')
        .addEventListener('click', () => {
            gTable2ClipSettings.insertSpecial('columnSep', 'newline');
        });

        document.querySelector('.save-button')
        .addEventListener('click', () => {
            gTable2ClipSettings.onAccept();
        });

        this.prefs = new Table2ClipPrefs();
        this.initControls();
    },

    onAccept : function() {
        var isValid = true;

        try {
            var format = new Table2ClipFormat();
            format.rowSep = this.escape(this.oRowSep.value);
            format.columnSep = this.escape(this.oColumnSep.value);
            format.appendRowSepAtEnd = this.oAppendSep.checked;

            this.prefs.setClipFormat(format);

            // TODO must be handled by savePrefs
            this.prefs.setBool("copyLinks", this.oCopyLinks.checked);
            this.prefs.setBool("copyStyles", this.oCopyStyles.checked);
            this.prefs.setBool("copyImages", this.oCopyImages.checked);
            this.prefs.setBool("copyFormElements", this.oCopyFormElements.checked);
            this.prefs.setString("attributeFiltersPattern", this.oAttributeFiltersPattern.value);

            this.prefs.savePrefs();
        } catch (err) {
            alert("gTable2ClipSettings.onAccept: " + err);
        }

        return isValid;
    },

    initControls : function() {
        this.specials = new Array();
        this.specials["tab"] = "\\t";
        this.specials["newline"] = "\\n";

        this.oRowSep = document.getElementById("rowSep");
        this.oColumnSep = document.getElementById("columnSep");
        this.oAppendSep = document.getElementById("appendRowSep");

        this.oCopyLinks = document.getElementById("copyLinks");
        this.oCopyStyles = document.getElementById("copyStyles");
        this.oCopyImages = document.getElementById("copyImages");
        this.oCopyFormElements = document.getElementById("copyFormElements");

        this.oAttributeFiltersPattern = document.getElementById("attributeFiltersPattern");

        this.initValues(true);
    },

    initValues : function(changeProfilePath) {
        var format = this.prefs.format;
        this.prefs.getClipFormat()
        .then((() => {
            this.oRowSep.value = this.unescape(format.rowSep);
            this.oColumnSep.value = this.unescape(format.columnSep);
            this.oAppendSep.checked = format.appendRowSepAtEnd;

            this.prefs.getBool("copyLinks", true)
            .then(((data) => {
                this.oCopyLinks.checked = data.copyLinks;
            }).bind(this));
            this.prefs.getBool("copyStyles", true)
            .then(((data) => {
                this.oCopyStyles.checked = data.copyStyles;
            }).bind(this));
            this.prefs.getBool("copyImages", true)
            .then(((data) => {
                this.oCopyImages.checked = data.copyImages;
            }).bind(this));
            this.prefs.getBool("copyFormElements", true)
            .then(((data) => {
                this.oCopyFormElements.checked = data.copyFormElements;
            }).bind(this));
            this.prefs.getString("attributeFiltersPattern", '')
            .then(((data) => {
                this.oAttributeFiltersPattern.value = data.attributeFiltersPattern;
            }).bind(this));
        }).bind(this));
    },

    unescape : function(str2unescape) {
        var str = "";
        var len = str2unescape.length;

        for (var i = 0; i < len; i++) {
            var ch = str2unescape.charAt(i);
            switch (ch) {
                case '\t':
                    str += "\\t";
                    break;
                case '\n':
                    str += "\\n";
                    break;
                case '\r':
                    str += "\\r";
                    break;
                case '\\':
                    str += "\\";
                    break;
                default:
                    str += ch;
                    break;
            }
        }

        return str;
    },

    escape : function(str2escape) {
        var str = "";
        var len = str2escape.length;

        for (var i = 0; i < len; ++i) {
            var ch = str2escape.charAt(i);

            if (ch == '\\') {
                if ((i + 1) >= len) {
                    break;
                }
                ch = str2escape.charAt(++i);
                switch (ch) {
                    case '\\':
                        str += '\\';
                        break;
                    case 'r':
                        str += '\r';
                        break;
                    case 'n':
                        str += '\n';
                        break;
                    case 't':
                        str += '\t';
                        break;
                    default:
                        str += ch;
                        break;
                }
            } else {
                str += ch;
            }
        }

        return str;
    },

    insertSpecial : function(controlName, charDesc) {
        var control = document.getElementById(controlName);

        if (control) {
            control.value += this.specials[charDesc];
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    gTable2ClipSettings.onLoad();
});
