/*
 *  Author: Austin Steeno
 *  Email: austin.steeno@gmail.com
 *  Twitter: @EndainGaming
 *  ---------------------------------------------------------------------------
 *  This file contains various polyfills, utility functions and also the
 *  implementation of the DynamicBuffer class.
 *
 *  The DynamicBuffer class is a javascript implementation of a Dynamic Array.
 *  It is simply an array that automatically resizes when it reaches capacity.
 *
 */


// ============================================================================
// Polyfill for CustomEvent for IE
( function () {
    function CustomEvent( event, params ) {
        params = params || {
            bubbles: false,
            cancelable: false,
            detail: undefined
        };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
    }

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
} )();


// ============================================================================
// Various utility functions

// Function to extend from one class to another
function extend( base, target ) {
    target.prototype._super = base.prototype;
    for ( var key in base.prototype )
        target.prototype[ key ] = base.prototype[ key ];
}

// Function to round to the nearest increment
function roundToIncrement( number, increment, offset ) {
    return Math.ceil( ( number - offset ) / increment ) * increment + offset;
}

// Function to shuffle an array
function shuffle( array, length ) {
    var counter = length;
    var temp, index;

    // While there are elements in the array
    while ( counter > 0 ) {
        // Pick a random index
        index = Math.floor( Math.random() * counter );

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        temp = array[ counter ];
        array[ counter ] = array[ index ];
        array[ index ] = temp;
    }

    return array;
}

// Function to bound a number between two other numbers
function bound( number, lower, upper ) {
    if ( number < lower )
        return lower;
    if ( number > upper )
        return upper;
    return number;
}

// Function to count the number of decimal places in a number
function decimalPlaces( num ) {
    // Coerce to string
    num = num + '';

    // Count decimal places
    var match = ( '' + num ).match( /(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/ );
    if ( !match )
        return 0;
    return Math.max( 0, ( match[ 1 ] ? match[ 1 ].length : 0 ) - ( match[ 2 ] ? +match[ 2 ] : 0 ) );
}

// ============================================================================
// Implementation of a DynamicBuffer for fast data storing and access
function DynamicBuffer( initial ) {
    this.init( initial );
};

// ----------------------------------------------------------------------------
// Define methods for DynamicBuffer class

// Function to initialize result set with interneal buffer of given size
DynamicBuffer.prototype.init = function ( initial ) {
    this.count = 0;
    this.data = new Array( initial > 8 ? initial : 8 );
}

// Function to add an object to the buffer
DynamicBuffer.prototype.push = function ( obj ) {
    // Check if the buffer is full or not
    if ( this.count === this.data.length ) {
        // The buffer is full, resize it first
        var old = this.data;

        // Make a new, bigger buffer of double size
        this.data = new Array( old.length * 2 );

        // Copy in the old items
        for ( var i = 0; i < old.length; i++ )
            this.data[ i ] = old[ i ];
    }

    // Add the object to the buffer and increase count
    this.data[ this.count ] = obj;
    this.count++;
}

// Function to remove the specified item from the buffer
DynamicBuffer.prototype.remove = function ( obj ) {
    var removed = false;
    for ( var i = 0; i < this.count; i++ ) {
        // Have to removed the object yet
        if ( removed ) {
            // We removed the item, so shift this object back 1 spot
            this.data[ i - 1 ] = this.data[ i ];
        } else {
            // Check if the current item is the item to remove, if so remove it
            if ( this.data[ i ] === obj )
                removed = true;
        }
    }

    // If the object was found and removed then decrement count
    if ( removed )
        this.count--;

    // Return if the object was removed or not
    return removed;
}

// Function to check if the object exists in the buffer already
DynamicBuffer.prototype.contains = function ( obj ) {
    // Scan for object
    for ( var i = 0; i < this.count; i++ ) {
        if ( this.data[ i ] === obj )
            return true;
    }

    // Object not found, return false
    return false;
}

// Function to clear the contents of the buffer
DynamicBuffer.prototype.clear = function () {
    this.count = 0;
}