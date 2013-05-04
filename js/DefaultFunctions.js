(function(context) {
    context.Validator.prototype.addDefaultFunctions = function() {
        this.addFunction("required", function(value) {
            if (typeof value === "undefined" || value === "" || value === null) {
                return false;
            }

            return true;
        });

        this.addFunction("min", function(value, min) {
            // If it's a number
            if ( ! isNaN(parseFloat(value)) && isFinite(value)) {
                return value >= min;

            // If it's a string (or "not a number")
            } else {
                return value.length >= min;
            }
        });

        this.addFunction("max", function(value, max) {
            // If it's a number
            if ( ! isNaN(parseFloat(value)) && isFinite(value)) {
                return value <= max;

            // If it's a string (or "not a number")
            } else {
                return value.length <= max;
            }
        });

        this.addFunction("between", function(value, min, max) {
            // If it's a number
            if ( ! isNaN(parseFloat(value)) && isFinite(value)) {
                return (value >= min && value <= max);

            // If it's a string (or "not a number")
            } else {
                return (value.length >= min && value.length <= max);
            }
        });

        // Thanks to http://badsyntax.co/post/javascript-email-validation-rfc822
        // This validation function is licensed under a Creative Commons Attribution-ShareAlike 2.5 License or the GPL:
        /*
            --

             Licensed under a Creative Commons Attribution-ShareAlike 2.5 License

             You are free:

                * to Share -- to copy, distribute, display, and perform the work
                * to Remix -- to make derivative works

             Under the following conditions:

                * Attribution. You must attribute the work in the manner specified by the author or licensor.
                * Share Alike. If you alter, transform, or build upon this work, you may distribute the resulting work only under a license identical to this one.

                * For any reuse or distribution, you must make clear to others the license terms of this work.
                * Any of these conditions can be waived if you get permission from the copyright holder.

             http://creativecommons.org/licenses/by-sa/2.5/

            --

             This program is free software; you can redistribute it and/or
             modify it under the terms of the GNU General Public License
             as published by the Free Software Foundation; either version 2
             of the License, or (at your option) any later version.

             This program is distributed in the hope that it will be useful,
             but WITHOUT ANY WARRANTY; without even the implied warranty of
             MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
             GNU General Public License for more details.

             You should have received a copy of the GNU General Public License
             along with this program; if not, write to the Free Software
             Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
             http://www.gnu.org/copyleft/gpl.html
         */
        this.addFunction("email", function(value) {
            var regex = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;
            return regex.test(value);
        });
    };
})(window.Pupil);