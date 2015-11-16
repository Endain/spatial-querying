/*
 *  Author: Austin Steeno
 *  Email: austin.steeno@gmail.com
 *  Twitter: @EndainGaming
 *  ---------------------------------------------------------------------------
 *  This file contains the implementation of a Grid class used for spatial
 *  partitioning and spatial querying to speed up collision detection.
 *
 */


// ============================================================================
// Implementation of a Grid for sparial querying
function Grid() {
    this.init();
};

// ----------------------------------------------------------------------------
// Define methods for Grid class

// Function to initialize a grid
Grid.prototype.init = function () {
    // Set basic grid definiation variables
    this.box = new THREE.Box2( new THREE.Vector2( 0, 0 ), new THREE.Vector2( 1, 1 ) );
    this.divisionsX = 7;
    this.divisionsY = 6;

    // Call reset to build grid cells
    this.reset( [], 1, 1 );
}

// Function to clear all inserted data out of the grid cells
Grid.prototype.clear = function () {
    // Loop through rows
    for ( var y = 0; y < this.data.length; y++ ) {
        // Loops through columns
        for ( var x = 0; x < this.data[ y ].length; x++ ) {
            // Clear the cell
            this.data[ y ][ x ].clear();
        }
    }
}

// Function to insert and object into the grid
Grid.prototype.insert = function ( obj ) {
    // Find the range of cells the object covers
    var xMin = ~~( obj.min.x / this.sizeX );
    var yMin = ~~( obj.min.y / this.sizeY );
    var xMax = ~~( obj.max.x / this.sizeX );
    var yMax = ~~( obj.max.y / this.sizeY );

    // Bound the min/max values
    if ( xMin < 0 )
        xMin = 0;
    if ( yMin < 0 )
        yMin = 0;
    if ( xMax >= this.divisionsX )
        xMax = this.divisionsX - 1;
    if ( yMax >= this.divisionsY )
        yMax = this.divisionsY - 1;

    // Insert the object into all cells
    var x, y;
    for ( y = yMin; y <= yMax; y++ )
        for ( x = xMin; x <= xMax; x++ )
            this.data[ y ][ x ].push( obj );
}

// Function to remove an object from the grid
Grid.prototype.remove = function ( obj ) {
    // Find the range of cells the object covers
    var xMin = ~~( obj.min.x / this.sizeX );
    var yMin = ~~( obj.min.y / this.sizeY );
    var xMax = ~~( obj.max.x / this.sizeX );
    var yMax = ~~( obj.max.y / this.sizeY );

    // Bound the min/max values
    if ( xMin < 0 )
        xMin = 0;
    if ( yMin < 0 )
        yMin = 0;
    if ( xMax >= this.divisionsX )
        xMax = this.divisionsX - 1;
    if ( yMax >= this.divisionsY )
        yMax = this.divisionsY - 1;

    // Remove the object from all cells
    var x, y;
    for ( y = yMin; y <= yMax; y++ )
        for ( x = xMin; x <= xMax; x++ )
            this.data[ y ][ x ].remove( obj );
}

// Function to query the grid for objects that intersect in the given bounding box
Grid.prototype.intersects = function ( obj, result ) {
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

    // Bound the min/max values
    if ( xMin < 0 )
        xMin = 0;
    if ( yMin < 0 )
        yMin = 0;
    if ( xMax >= this.divisionsX )
        xMax = this.divisionsX - 1;
    if ( yMax >= this.divisionsY )
        yMax = this.divisionsY - 1;

    // Return all objects from all the cells it covers if they intersect
    var x, y, i, buffer, stored;
    for ( y = yMin; y <= yMax; y++ ) {
        for ( x = xMin; x <= xMax; x++ ) {
            buffer = this.data[ y ][ x ];
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

// Function to reset the grid to its default state
Grid.prototype.reset = function ( objs, width, height ) {
    // Change the top-level box size
    this.box = new THREE.Box2( new THREE.Vector2( 0, 0 ), new THREE.Vector2( width, height ) );

    // Calculate relevant size data
    this.sizeX = width / this.divisionsX;
    this.sizeY = height / this.divisionsY;

    // Reset grid data
    this.data = new Array( this.divisionsY );
    for ( var y = 0; y < this.divisionsY; y++ ) {
        this.data[ y ] = new Array( this.divisionsX );
        for ( var x = 0; x < this.divisionsX; x++ ) {
            this.data[ y ][ x ] = new DynamicBuffer();
            this.data[ y ][ x ].min = new THREE.Vector2( x * this.sizeX, y * this.sizeY );
            this.data[ y ][ x ].max = new THREE.Vector2( ( x + 1 ) * this.sizeX, ( y + 1 ) * this.sizeY );
        }
    }

    // Insert all the objects
    for ( var i = 0; i < objs.length; i++ )
        this.insert( objs[ i ] );
}

// Function to render the spatial partitioning structure for visualization
Grid.prototype.render = function ( boxes ) {
    // Keep count of the boxes used so far
    var count = 0;

    // Render any boxes with content
    var x, y, cell;
    for ( y = 0; y < this.divisionsY; y++ ) {
        for ( x = 0; x < this.divisionsX; x++ ) {
            // Render the box if it has conent
            cell = this.data[ y ][ x ];
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