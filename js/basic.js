/*
 *  Author: Austin Steeno
 *  Email: austin.steeno@gmail.com
 *  Twitter: @EndainGaming
 *  ---------------------------------------------------------------------------
 *  This file contains the implementation of a NO-OP spatial partitioning class
 *  to emulate the case where there is no spatial partitioning and all objects
 *  are stored in the same global store.
 *
 */


// ============================================================================
// Implementation of a no-op partitioning method
function Basic() {
    this.init();
};

// ----------------------------------------------------------------------------
// Define methods for Basic (no-op partitioning) class

// Function to initialize a no-op partitioning structure
Basic.prototype.init = function () {
    this.data = new DynamicBuffer();
}

// Function to clear all inserted data out of the space partitioning structure
Basic.prototype.clear = function () {
    this.data.clear();
}

// Function to insert an object into the space partitioning structure
Basic.prototype.insert = function ( obj ) {
    // NO-OP
}

// Function to remove an object from the space partitioning structure
Basic.prototype.remove = function ( obj ) {
    // NO-OP
}

// Function to query the space partitioning structure for objects that intersect in the given bounding box
Basic.prototype.intersects = function ( obj, result ) {
    // Get/create buffer to store objects that intersect
    if ( !result )
        result = new DynamicBuffer();

    // Clear the buffer
    result.clear();

    // Basic brute force intersection test - we test against every other object
    var stored;
    for ( var i = 0; i < this.data.count; i++ ) {
        // Get the current box
        stored = this.data.data[ i ];

        // Check for intersection
        if ( obj !== stored ) {
            if ( obj.isIntersectionBox( stored ) || obj.containsBox( stored ) || stored.containsBox( obj ) )
                result.push( stored );
        }
    }

    // Return the result set buffer
    return result;
}

// Function to reset the no-op space partitioning structure to its default state
Basic.prototype.reset = function ( objs ) {
    // Call init with the same settings the object originally had
    this.init();

    // Insert all the objects
    for ( var i = 0; i < objs.length; i++ )
        this.data.push( objs[ i ] );
}

// Function to render some visualization of the underlying space partitioning structure
Basic.prototype.render = function ( boxes ) {
    // Blank out all boxes
    for ( var i = 0; i < boxes.count; i++ )
        boxes.data[ i ].alpha = 0;
}