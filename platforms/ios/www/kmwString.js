/**
  @preserve (C) 2012 Tavultesoft Pty Ltd
  
  Adds functions to treat supplementary plane characters in the same 
  way as basic multilingual plane characters in JavaScript.
  
  Version 0.2
  
  License
  
  The contents of this file are subject to the Mozilla Public License
  Version 1.1 (the "License"); you may not use this file except in
  compliance with the License. You may obtain a copy of the License at
  http://www.mozilla.org/MPL/

  Software distributed under the License is distributed on an "AS IS"
  basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
  License for the specific language governing rights and limitations
  under the License.

  The Original Code is (C) 2012 Tavultesoft Pty Ltd.

  The Initial Developer of the Original Code is Tavultesoft.
*/

/**
 * Constructs a string from one or more Unicode character codepoint values 
 * passed as integer parameters.
 * 
 * @param  {integer} cp0,...   1 or more Unicode codepoints, e.g. 0x0065, 0x10000
 * @return {String}            The new String object.
 */
String.kmwFromCharCode = function() {
  var chars = [], i;
  for (i = 0; i < arguments.length; i++) {
    var c = Number(arguments[i]);
    if (!isFinite(c) || c < 0 || c > 0x10FFFF || Math.floor(c) !== c) {
      throw new RangeError("Invalid code point " + c);
    }
    if (c < 0x10000) {
      chars.push(c);
    } else {
      c -= 0x10000;
      chars.push((c >> 10) + 0xD800);
      chars.push((c % 0x400) + 0xDC00);
    }
  }
  return String.fromCharCode.apply(undefined, chars);
}

/**
 * Returns a number indicating the Unicode value of the character at the given 
 * code point index, with support for supplementary plane characters.
 * 
 * @param  {integer} codePointIndex  The code point index into the string (not 
                                     the code unit index) to return
 * @return {integer}                 The Unicode character value
 */
String.prototype.kmwCharCodeAt = function(codePointIndex) {
  var str = String(this);
  var codeUnitIndex = 0;
  
  if (codePointIndex < 0 || codePointIndex  >= str.length) {
    return NaN;
  }

  for(var i = 0; i < codePointIndex; i++) {
    codeUnitIndex = str.kmwNextChar(codeUnitIndex);
    if(codeUnitIndex == undefined) return NaN;
  }
  
  var first = str.charCodeAt(codeUnitIndex);
  if (first >= 0xD800 && first <= 0xDBFF && str.length > codeUnitIndex + 1) {
    var second = str.charCodeAt(codeUnitIndex + 1);
    if (second >= 0xDC00 && second <= 0xDFFF) {
      return ((first - 0xD800) << 10) + (second - 0xDC00) + 0x10000;
    }
  }
  return first;  
}

/**
 * Returns the code point index within the calling String object of the first occurrence
 * of the specified value, or -1 if not found.
 * 
 * @param  {string}  searchValue    The value to search for
 * @param  {integer} fromIndex      Optional code point index to start searching from
 * @return {integer}                The code point index of the specified search value
 */
String.prototype.kmwIndexOf = function(searchValue, fromIndex) {
  var str = String(this);
  var codeUnitIndex = str.indexOf(searchValue, fromIndex);
  
  if(codeUnitIndex < 0) {
    return codeUnitIndex;
  }
  
  var codePointIndex = 0;
  for(var i = 0; i < codeUnitIndex; i = str.kmwNextChar(i), codePointIndex++);
  return codePointIndex;
}

/**
 * Returns the code point index within the calling String object of the last occurrence 
 * of the specified value, or -1 if not found.
 * 
 * @param  {string}  searchValue    The value to search for
 * @param  {integer} fromIndex      Optional code point index to start searching from
 * @return {integer}                The code point index of the specified search value
 */
String.prototype.kmwLastIndexOf = function(searchValue, fromIndex)
{
  var str = String(this);
  var codeUnitIndex = str.lastIndexOf(searchValue, fromIndex);
  
  if(codeUnitIndex < 0) {
    return codeUnitIndex;
  }
  
  var codePointIndex = 0;
  for(var i = 0; i < codeUnitIndex; i = str.kmwNextChar(i), codePointIndex++);
  return codePointIndex;
}

/**
 * Returns the length of the string in code points, as opposed to code units.
 * 
 * @return {integer}                The length of the string in code points
 */
String.prototype.kmwLength = function() {
  var str = String(this);
  
  if(str.length == 0) {
    return 0;
  }
  
  for(var i = 0, codeUnitIndex = 0; codeUnitIndex != undefined; i++, 
    codeUnitIndex = str.kmwNextChar(codeUnitIndex));
  return i;
}

/**
 * Extracts a section of a string and returns a new string.
 * 
 * @param  {integer} beginSlice    The start code point index in the string to 
 *                                 extract from
 * @param  {integer} endSlice      Optional end code point index in the string
 *                                 to extract to
 * @return {string}                The substring as selected by beginSlice and
 *                                 endSlice
 */
String.prototype.kmwSlice = function(beginSlice, endSlice) {
  var str = String(this);
  var beginSliceCodeUnit = str.kmwCodePointToCodeUnit(beginSlice);
  var endSliceCodeUnit = str.kmwCodePointToCodeUnit(endSlice);
  return str.slice(beginSliceCodeUnit, endSliceCodeUnit);
}

/**
 * Returns the characters in a string beginning at the specified location through
 * the specified number of characters.
 * 
 * @param  {integer} start         The start code point index in the string to 
 *                                 extract from
 * @param  {integer} length        Optional length to extract
 * @return {string}                The substring as selected by start and length
 */
String.prototype.kmwSubstr = function(start, length)
{
  var str = String(this);
  if(start < 0)
  {
    start = str.kmwLength() + start;
    if(start < 0) {
      start = 0;
    }
  }
  var startCodeUnit = str.kmwCodePointToCodeUnit(start);
  var endCodeUnit = startCodeUnit;
  
  if(length == undefined) {
    endCodeUnit = str.length;
  } else {
    for(var i = 0; i < length; i++, endCodeUnit = str.kmwNextChar(endCodeUnit));
  }

  return str.substring(startCodeUnit, endCodeUnit);
}

/**
 * Returns the characters in a string between two indexes into the string.
 * 
 * @param  {integer} indexA        The start code point index in the string to 
 *                                 extract from
 * @param  {integer} indexB        The end code point index in the string to 
 *                                 extract to
 * @return {string}                The substring as selected by indexA and indexB
 */
String.prototype.kmwSubstring = function(indexA, indexB)
{
  var str = String(this),indexACodeUnit,indexBCodeUnit;
  
  if(typeof(indexB) == 'undefined') 
  {
    indexACodeUnit = str.kmwCodePointToCodeUnit(indexA);
    indexBCodeUnit = str.length;
  } 
  else
  {
    if(indexA > indexB) { var c = indexA; indexA = indexB; indexB = c; }
  
    indexACodeUnit = str.kmwCodePointToCodeUnit(indexA);
    indexBCodeUnit = str.kmwCodePointToCodeUnit(indexB);
  }
  if(isNaN(indexACodeUnit)) indexACodeUnit = 0;
  if(isNaN(indexBCodeUnit)) indexBCodeUnit = str.length;

  return str.substring(indexACodeUnit, indexBCodeUnit);
}

/*
  Helper functions
*/

/**
 * Returns the code unit index for the next code point in the string, accounting for
 * supplementary pairs 
 *
 * @param  {integer} codeUnitIndex   The code unit position to increment
 * @return {integer}                 The index of the next code point in the string,
 *                                   in code units
*/
String.prototype.kmwNextChar = function(codeUnitIndex) {
  var str = String(this);
  
  if(codeUnitIndex < 0 || codeUnitIndex >= str.length - 1) {
    return undefined;
  }
  
  var first = str.charCodeAt(codeUnitIndex);
  if (first >= 0xD800 && first <= 0xDBFF && str.length > codeUnitIndex + 1) {
    var second = str.charCodeAt(codeUnitIndex + 1);
    if (second >= 0xDC00 && second <= 0xDFFF) {
      if(codeUnitIndex == str.length - 2) {
        return undefined;
      }
      return codeUnitIndex + 2;
    }
  }
  return codeUnitIndex + 1;
}

/**
 * Returns the code unit index for the previous code point in the string, accounting
 * for supplementary pairs 
 *
 * @param  {integer} codeUnitIndex   The code unit position to decrement
 * @return {integer}                 The index of the previous code point in the
 *                                   string, in code units
*/
String.prototype.kmwPrevChar = function(codeUnitIndex) {
  var str = String(this);

  if(codeUnitIndex <= 0 || codeUnitIndex > str.length) {
    return undefined;
  }
  
  var second = str.charCodeAt(codeUnitIndex - 1);
  if (second >= 0xDC00 && first <= 0xDFFF && codeUnitIndex > 1) {
    var first = str.charCodeAt(codeUnitIndex - 2);
    if (first >= 0xD800 && second <= 0xDBFF) {
      return codeUnitIndex - 2;
    }
  }
  return codeUnitIndex - 1;
}

/**
 * Returns the corresponding code unit index to the code point index passed
 *
 * @param  {integer} codePointIndex  A code point index in the string
 * @return {integer}                 The corresponding code unit index
*/
String.prototype.kmwCodePointToCodeUnit = function(codePointIndex) {
  var str = String(this);
  
  var codeUnitIndex = 0;

  if(codePointIndex < 0) {
    codeUnitIndex = str.length;
    for(var i = 0; i > codePointIndex; i--, 
      codeUnitIndex = str.kmwPrevChar(codeUnitIndex)); 
    return codeUnitIndex;
  }
  
  if(codePointIndex == str.kmwLength()) return str.length;

  for(var i = 0; i < codePointIndex; i++,
    codeUnitIndex = str.kmwNextChar(codeUnitIndex));
  return codeUnitIndex;
}

/**
 * Returns the corresponding code point index to the code unit index passed
 *
 * @param  {integer} codeUnitIndex  A code unit index in the string
 * @return {integer}                The corresponding code point index
*/
String.prototype.kmwCodeUnitToCodePoint = function(codeUnitIndex) {
  var str = String(this);
  
  if(codeUnitIndex == 0)
    return 0;
  else if(codeUnitIndex < 0)     
    return str.substr(codeUnitIndex).kmwLength();
  else
    return str.substr(0,codeUnitIndex).kmwLength();
}

/**
 * Returns the character at a the code point index passed
 *
 * @param  {integer} codePointIndex  A code point index in the string
 * @return {string}                  The corresponding character
*/
String.prototype.kmwCharAt = function(codePointIndex) {
  var str = String(this);
  
  if(codePointIndex >= 0) return str.kmwSubstr(codePointIndex,1); else return '';
}

