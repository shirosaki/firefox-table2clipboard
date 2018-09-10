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
# Portions created by the Initial Developer are Copyright (C) 2009-2010
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
if (typeof table2clipboard == "undefined") {
    var table2clipboard = {};
}

if (typeof table2clipboard.tableInfo == "undefined") {
    table2clipboard.tableInfo = {};
}

(function() {
    /**
     * Get structure info for passed table
     * @param table the table DOM node used to get tableInfo
     * @returns the object
     * {
     * tableNode : node,
     * rows : [{rowNode : node,
     *          cells : [{cellNode:node}]
     *        }]
     * }
     */
    this.getTableInfoFromTable = function(table) {
        var arrRow = new Array();
        var minColumn = 0;
        var maxColumn = -1;
        var rows = table.rows;

        for (var i = 0; i < rows.length; i++) {
            // rows[i] type is nsIDOMHTMLTableRowElement
            var row = rows[i];
            var cells = row.cells;
            var arrCol = new Array();
            var colsInRow = 0;

            for (var cc = 0; cc < cells.length; cc++) {
                // theCell type is HTMLTableCellElement
                var theCell = cells.item(cc);
                arrCol[cc] = {cellNode : theCell};
                var cs = parseInt(theCell.getAttribute("colspan"));
                if (cs > 0) {
                    // subtract column itself
                    // otherwise when adding length it is computed twice
                    colsInRow += cs - 1;
                }
            }

            // Adjust the value if row contains a colspan
            colsInRow += arrCol.length;
            if (maxColumn < colsInRow) {
                maxColumn = colsInRow;
            }
            arrRow.push({rowNode : row, cells : arrCol, colsInRow : colsInRow});
        }

        this.padCells(arrRow, minColumn, maxColumn);
        return {tableNode : table, rows : arrRow};
    }

    /**
     * Get structure info for table contained inside the passed selection
     * @param sel the selection object
     * @param tableNode the table DOM node, if null is determinated from
     * selection
     * @returns the object
     * {
     * tableNode : node,
     * rows : [{rowNode : node,
     *          cells : [{cellNode:node}]
     *        }]
     * }
     */
    this.getTableInfoFromSelection = function(sel, tableNode) {
        var arrRow = new Array();
        var minColumn = 100000;
        var maxColumn = -1;
        var columnCount = 0;

        for (var i = 0; i < sel.rangeCount; i += columnCount) {
            columnCount = this.getColumnsPerRow(sel, i);
            var row = sel.getRangeAt(i).startContainer;
            var cells = row.cells;

            var arrCol = new Array();
            var rangeIndexStart = i;
            var rangeIndexEnd = i + columnCount;
            var colsInRow = 0;

            for (var cc = 0; cc < cells.length && rangeIndexStart < rangeIndexEnd; cc++) {
                var theCell = cells.item(cc);

                if (sel.containsNode(theCell, false))  {
                    rangeIndexStart++;

                    arrCol[cc] = {cellNode : theCell};
                    if (minColumn > cc) {
                        minColumn = cc;
                    }
                    var cs = parseInt(theCell.getAttribute("colspan"));
                    if (cs > 0) {
                        // subtract column itself
                        // otherwise when adding length it is computed twice
                        colsInRow += cs - 1;
                    }
                } else {
                    arrCol[cc] = null;
                }
            }
            colsInRow += arrCol.length;
            if (maxColumn < colsInRow) {
                maxColumn = colsInRow;
            }
            arrRow.push({rowNode : row, cells : arrCol, colsInRow : colsInRow});
        }

        this.padCells(arrRow, minColumn, maxColumn);

        if (!tableNode && arrRow.length > 0) {
            tableNode = this.findTableFromNode(arrRow[0].rowNode);
        }

        return {tableNode : tableNode, rows : arrRow};
    }

    /**
     * Pad cell arrays to have all same dimension and remove starting blank cells
     * @param arrRow cells array
     * @param minColumn the minimum column count
     * @param maxColumn the maximum coloun count
     */
    this.padCells = function(arrRow, minColumn, maxColumn) {
        // Fill all rows to maximum number of cells
        for (var i = 0; i < arrRow.length; i++) {
            var cells = arrRow[i].cells;
            var fillCount = maxColumn - arrRow[i].colsInRow;
            for (var j = 0; j < fillCount; j++) {
                cells.push(null);
            }
            // remove empty rows at left
            arrRow[i].cells = cells.slice(minColumn);
        }
    }

    this.getColumnsPerRow = function(sel, startPos) {
        var currPos = startPos;
        var range = sel.getRangeAt(currPos);
        var currRowIndex = range.startContainer.rowIndex;

        while (++currPos < sel.rangeCount) {
            range = sel.getRangeAt(currPos);

            if (range.startContainer.rowIndex != currRowIndex) {
                break;
            }
        }

        return currPos - startPos;
    }

    this.findTableFromNode = function(node) {
        return this.getAncestorByTagName(node, "table");
    }

    /**
     * Get the node's ancestor with tagName
     * @param node starting node
     * @param tagName the ancestor tag name
     * @returns the ancestor or null
     */
    this.getAncestorByTagName = function(node, tagName) {
        const TEXT_NODE = Node.TEXT_NODE;
        tagName = tagName.toLowerCase();

        // find also non-text node that has not tag name (the document object)
        while (node
               && ((node.nodeName && node.nodeName.toLowerCase() != tagName)
                   || (!node.nodeName && node.nodeType != TEXT_NODE))) {
            node = node.parentNode;
        }
        return node;
    }

    /**
     * Get all nodes relative to TABLE tag, nested tables are not returned
     * @param doc the document to use
     * @param rootNode the root node from which start search
     * @returns {Array} dom nodes
     */
    this.getRootTables = function(doc, rootNode) {
        var nodeList = [];

        var treeWalker = doc.createTreeWalker(
            rootNode,
            NodeFilter.SHOW_ELEMENT,
            function(node) {
                if (node.nodeName.toLowerCase() == "table") {
                    // table node must be added to array but its children must
                    // be rejected so nested tables (if present) will be skipped.
                    // we fill the array here instead of on the traversal loop
                    nodeList.push(node);
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_SKIP;
            },
            false);

        while (treeWalker.nextNode()) {
            // empty loop
        }

        return nodeList;
    }

    /**
     * Select cells
     * @param sel the selection object
     * @param {array} cells cells to select
     */
    this.selectCells = function(sel, cells) {
        if (sel.isCollapsed) {
            // the browsers when collapse the selection should create a dummy
            // range object that causes problem to this method, to be sure that
            // only our ranges are present we simply remove any existing one.
            // On Gecko the selection contains a TEXT_NODE equals to 'null' when user
            // 1. select some column
            // 2. click on some area to remove current selection
            // 3. select again some column
            sel.removeAllRanges();
        }

        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];

            var range = document.createRange();
            range.setStartBefore(cell, 0);
            range.setEndAfter(cell, 0);

            sel.addRange(range);
        }
    }

    /**
     * Get columns (vertical cells) starting from a node
     * @param node the starting node from witch to find the TD element
     * @returns {array} the cell columns relative to passed node
     */
    this.getTableColumnsByNode = function(node) {
        var cell = this.getCellNode(node);
        var table = this.findTableFromNode(node);
        var rows = table.rows;
        var cellPos;

        for (var r = 0; r < rows.length && !cellPos; r++) {
            var row = rows[r];
            var currCells = row.cells;
            var pos = 1;

            for (var c = 0; c < currCells.length; c++) {
                var currCell = currCells[c];

                if (currCell == cell) {
                    cellPos = pos;
                    break;
                }
                pos += currCell.colSpan;
            }
        }

        var cells = [];

        for (var r = 0; r < rows.length; r++) {
            var row = rows[r];
            var currCells = row.cells;
            var pos = 0;

            for (var c = 0; c < currCells.length; c++) {
                var currCell = currCells[c];
                pos += currCell.colSpan;

                if (pos >= cellPos) {
                    cells.push(currCell);
                    break;
                }
            }
        }
        return cells;
    }

    /**
     * Get the cell starting from node
     * @node the node from which to begin the search
     * @returns the cell node found, null otherwise
     */
    this.getCellNode = function(node) {
        // TODO Must be optimized
        return this.getAncestorByTagName(node, "td")
                || this.getAncestorByTagName(node, "th");
    }
}).apply(table2clipboard.tableInfo);
