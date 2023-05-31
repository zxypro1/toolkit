export interface ProgressBarOptions {
   /**
    * Total number of ticks to complete.
    */
   total: number;
 
   /**
    * current completed index
    */
   curr?: number;
 
   /**
    * head character defaulting to complete character
    */
   head?: string;
 
   /**
    * The displayed width of the progress bar defaulting to total.
    */
   width?: number;
 
   /**
    * minimum time between updates in milliseconds defaulting to 16
    */
   renderThrottle?: number;
 
   /**
    * The output stream defaulting to stderr.
    */
   stream?: NodeJS.WritableStream;
 
   /**
    * Completion character defaulting to "=".
    */
   complete?: string;
 
   /**
    * Incomplete character defaulting to "-".
    */
   incomplete?: string;
 
   /**
    * Option to clear the bar on completion defaulting to false.
    */
   clear?: boolean;
 
   /**
    * Optional function to call when the progress bar completes.
    */
   callback?: Function;
 }
 