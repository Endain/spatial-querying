/*
 *  Author: Austin Steeno
 *  Email: austin.steeno@gmail.com
 *  Twitter: @EndainGaming
 *  ---------------------------------------------------------------------------
 *  This file contains the implementation of a Performance class used for
 *  tracking and graphing the time taken by the simulation logic for each step
 *  of the simulation. It displays a histogram of the milliseconds taken for
 *  each simulation step displays the average step time over the last 5 steps.
 *
 */


// ============================================================================
// Class to handle displaying basic performance data
function Performance( target ) {
    this.init( target );
};

// ----------------------------------------------------------------------------
// Define methods for Performance class

// Function to initialize the performance tracker
Performance.prototype.init = function ( target ) {
    // Grab the target element
    this.target = $( target );

    // Create a buffer of stat values
    this.values = [ 0, 0, 0, 0 ];

    // Only continue if target is valid
    if ( target ) {
        // Configure the graph width and height
        var w = 70;
        var h = 16;

        // Create a container element
        this.container = $( document.createElement( 'div' ) );
        this.container.addClass( 'performance' );
        this.container.css( 'position', 'absolute' );
        this.container.css( 'left', '8px' );
        this.container.css( 'bottom', '8px' );
        this.container.css( 'display', 'table' );
        this.container.css( 'height', h + 'px' );
        this.container.css( 'margin', '0px' );
        this.container.css( 'padding', '0px' );
        this.container.css( 'border', '2px solid #222222' );
        this.container.css( 'border-radius', '2px' );
        this.container.css( 'background-color', '#161616' );
        this.container.css( 'z-index', '50' );

        this.graph = $( document.createElement( 'canvas' ) );
        this.graph.addClass( 'graph' );
        this.graph.css( 'display', 'table-cell' );
        this.graph.css( 'vertical-align', 'bottom' );
        this.graph.css( 'width', w + 'px' );
        this.graph.css( 'height', h + 'px' );

        this.time = $( document.createElement( 'div' ) );
        this.time.addClass( 'time' );
        this.time.css( 'display', 'table-cell' );
        this.time.css( 'vertical-align', 'bottom' );
        this.time.css( 'padding', '0px 4px' );
        this.time.css( 'color', '#ececec' );
        this.time.css( 'font-size', '10px' );
        this.time.text( '0ms' );

        // Add elements to DOM
        this.container.append( this.graph );
        this.container.append( this.time );

        this.target.append( this.container );

        // Set up graph for rendering
        this.canvas = this.graph[ 0 ];
        this.context = this.canvas.getContext( "2d" );

        this.gw = this.canvas.clientWidth * 2.2;
        this.gh = this.canvas.clientHeight;

        this.context.width = this.gw;
        this.context.height = this.gh;
        this.context.canvas.width = this.gw;
        this.context.canvas.height = this.gh;

        this.context.fillStyle = '#161616';
        this.context.fillRect( 0, 0, this.gw, this.gh );
    }
}

// Function to push a new stat value into the performance tracker
Performance.prototype.push = function ( value ) {
    // Move all the old values over
    for ( var i = 1; i < this.values.length; i++ )
        this.values[ i - 1 ] = this.values[ i ];

    // Add the new value
    this.values[ this.values.length - 1 ] = value;

    // Find a new average and update the text
    var average = 0;
    for ( var i = 0; i < this.values.length; i++ )
        average += this.values[ i ];
    average = average / this.values.length;
    this.time.text( parseFloat( average ).toFixed( 2 ) + 'ms' );

    // Add a new bar to the graph
    this._shiftContents();
    this._drawLine( this.gw, this.gh, this.gw, 0, '#161616' );
    this._drawLine( this.gw, this.gh, this.gw, this.gh - ( value / 1.5 ), value > 16 ? '#FFA557' : '#55F760' );
}

// Function to draw a line on the graph
Performance.prototype._drawLine = function ( x1, y1, x2, y2, color ) {
    this.context.fillStyle = color;
    this.context.strokeStyle = color;

    this.context.beginPath();
    this.context.moveTo( x1, y1 );
    this.context.lineTo( x2, y2 );
    this.context.lineWidth = 1;
    this.context.stroke();
    this.context.closePath();
}

Performance.prototype._shiftContents = function () {
    this.context.drawImage( this.canvas, -1, 0 );
}