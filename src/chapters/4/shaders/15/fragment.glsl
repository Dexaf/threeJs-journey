varying vec3 v_position;

uniform float u_sliceAngleStart;
uniform float u_arcAngle;

void main() {
    //get the current angle of the working frag
    float currFragAngle = atan(v_position.y, v_position.x);

    //this thing apply the patch map created outside
    float csm_Slice;

    /*NOTE -    
        questo metodo non mi piace matematicamente ma e' semplice:
        cosi lui considera l'angolo 0 come la partenza
        e porta tutti gli angoli che sono inferiori all'inizio
        sotto zero, con il modulo questi prendono valore maggiore
        dal arcAngle, se invece sono maggiori questi rientrano
        dentro arcAngle e il discard avviene.
        funziona ma sarebbe stato piu chiaro far loopare la
        somma di u_sliceAngleStart e u_arcAngle per poi valutare
        semplicemente se currFragAngle era minore in caso di loop 
    */
    //make the angle start from u_sliceAngleStart
    currFragAngle -= u_sliceAngleStart;
    //use the mod operator to loop the angle
    //from 0 to 2PI
    //in glsl the mod operator brings value back to positive
    //if they are negative
    currFragAngle = mod(currFragAngle, PI * 2.0);

    //if the current angle is highter then 0 and less then the whole
    //arc angle then we slice
    if(currFragAngle > 0.0 && currFragAngle < u_arcAngle)
        discard;

    //here would have colored the outline of the sliced gear
    //but the presence of csm_FragColor make the gl_FragColor
    //disappear and we lose all the pbr colors
    // if(!gl_FrontFacing)
    //     csm_FragColor = vec4(0.75, 0.15, 0.3, 1.0);
}