/*
 *  Author: Austin Steeno
 *  Email: austin.steeno@gmail.com
 *  Twitter: @EndainGaming
 *  ---------------------------------------------------------------------------
 *  This file contains the implementation of a SpatialHash class used for
 *  spatial partitioning and spatial querying to speed up collision detection.
 *
 */


// ============================================================================
// Implementation of a Spatial Hash for sparial querying
function SpatialHash() {
    this.init();
};

// ----------------------------------------------------------------------------
// Define methods for SpatialHash class

// Function to initialize a spatial hash
SpatialHash.prototype.init = function () {
    // Set basic spatial hash definiation variables
    this.sizeX = 110;
    this.sizeY = 110;

    this.data = {};

    // Call reset to build initial spatial hash cells
    this.reset( [] );
}

// Function to clear all inserted data out of the spatial hash cells
SpatialHash.prototype.clear = function () {
    var x, y, row, cell, rowKey, cellKey;
    for ( rowKey in this.data ) {
        // Get the row
        row = this.data[ rowKey ];

        // Validate the row exists
        if ( !row )
            continue;

        for ( cellKey in row ) {
            // Get the cell
            cell = row[ cellKey ];

            // Validate the cell exists
            if ( !cell )
                continue;

            // Clear the cell
            cell.clear();
        }
    }
}

// Function to insert and object into the spatial
SpatialHash.prototype.insert = function ( obj ) {
    // Find the range of cells the object covers
    var xMin = ~~( obj.min.x / this.sizeX );
    var yMin = ~~( obj.min.y / this.sizeY );
    var xMax = ~~( obj.max.x / this.sizeX );
    var yMax = ~~( obj.max.y / this.sizeY );

    // Insert the object into all cells
    var x, y, row, cell;
    for ( y = yMin; y <= yMax; y++ ) {
        // Get the row
        row = this.data[ y ];

        // Validate the the row exists
        if ( !row ) {
            this.data[ y ] = {};
            row = this.data[ y ];
        }

        for ( x = xMin; x <= xMax; x++ ) {
            // Get the cell
            cell = row[ x ];

            // Validate the cell exists
            if ( !cell ) {
                row[ x ] = new DynamicBuffer();
                cell = row[ x ];

                // Set min/max for rendering
                cell.min = new THREE.Vector2( x * this.sizeX, y * this.sizeY );
                cell.max = new THREE.Vector2( x * this.sizeX + this.sizeX, y * this.sizeY + this.sizeY );
            }

            // Insert the object into the cell
            cell.push( obj );
        }
    }
}

// Function to remove an object from the spatial hash
SpatialHash.prototype.remove = function ( obj ) {
    // Find the range of cells the object covers
    var xMin = ~~( obj.min.x / this.sizeX );
    var yMin = ~~( obj.min.y / this.sizeY );
    var xMax = ~~( obj.max.x / this.sizeX );
    var yMax = ~~( obj.max.y / this.sizeY );

    // Remove the object from all cells
    var x, y, row, cell;
    for ( y = yMin; y <= yMax; y++ ) {
        // Get the row
        row = this.data[ y ];

        // Validate the the row exists
        if ( !row )
            continue;

        for ( x = xMin; x <= xMax; x++ ) {
            // Get the cell
            cell = row[ x ];

            // Validate the cell exists
            if ( !cell )
                continue;

            // Remove the object from the cell
            cell.remove( obj );
        }
    }
}

// Function to query the spatial hash for objects that intersect in the given bounding box
SpatialHash.prototype.intersects = function ( obj, result ) {
    // Get/create buffer to store objects that intersect
    if ( !result )
        result = new DynamicBuffer();

    // Clear the buffer
    result.clear();

    // Find the range of cells the object covers
    var xMin = ~~( obj.min.x / this.sizeX );
    var yMin = ~~( obj.min.y / this.sizeY );
    var xMax = ~~( obj.max.x / this.sizeX );
    var yMax = ~~( obj.max.y / this.sizeY );

    // Return all objects from all the cells it covers if they intersect
    var x, y, i, buffer, stored, row;
    for ( y = yMin; y <= yMax; y++ ) {
        // Get the row
        row = this.data[ y ];

        // Validate the the row exists
        if ( !row )
            continue;

        for ( x = xMin; x <= xMax; x++ ) {
            // Get the cell/buffer
            buffer = row[ x ];

            // Validate the cell/buffer exists
            if ( !buffer )
                continue;

            for ( i = 0; i < buffer.count; i++ ) {
                // Get the current stored object
                stored = buffer.data[ i ];

                // Check if the object overlaps
                if ( obj !== stored ) {
                    if ( obj.isIntersectionBox( stored ) || obj.containsBox( stored ) || stored.containsBox( obj ) ) {
                        // Only add the object if we didn't add it already
                        if ( !result.contains( stored ) )
                            result.push( stored );
                    }
                }
            }
        }
    }

    // Return the result set buffer
    return result;
}

// Function to reset the spatial hash to its default state
SpatialHash.prototype.reset = function ( objs ) {
    // Reset hash data
    this.data = {};

    // Insert all the objects
    for ( var i = 0; i < objs.length; i++ )
        this.insert( objs[ i ] );
}

// Function to render the spatial partitioning structure for visualization
SpatialHash.prototype.render = function ( boxes ) {
    // Keep count of the boxes used so far
    var count = 0;

    // Render any boxes with content
    var x, y, row, cell, rowKey, cellKey;
    for ( rowKey in this.data ) {
        // Get the row
        row = this.data[ rowKey ];

        // Validate the row exists
        if ( !row )
            continue;

        for ( cellKey in row ) {
            // Get the cell
            cell = row[ cellKey ];

            // Validate the cell exists
            if ( !cell )
                continue;

            // Render the box if it has conent
            if ( cell.count > 0 ) {
                boxes.data[ count ].alpha = 0.975;
                boxes.data[ count ].color.setRGB( 0.329 * 0.4, 0.918 * 0.4, 0.945 * 0.4 );
                boxes.data[ count ].set( cell.min, cell.max );
                count++;
            }
        }
    }

    // Clear out any remaining boxes
    var i;
    for ( i = count; i < boxes.count; i++ )
        boxes.data[ i ].alpha = 0;
}