varying vec3 v_position;

void main() {
    //mandiamo la posizione del frammento al frag
    //per decidere cosa scartare
    v_position = csm_Position.xyz;
}