// Original synthesised sounds: no third-party assets or automatic playback.
export class RacingAudio {
    constructor(){this.context=null;this.enabled=true;this.lastCollision=0;}
    unlock(){
        if(!this.enabled)return;
        const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
        if(!this.context){
            this.context=new Context();this.motor=this.context.createOscillator();this.filter=this.context.createBiquadFilter();this.gain=this.context.createGain();
            this.motor.type='sawtooth';this.filter.type='lowpass';this.filter.frequency.value=260;this.gain.gain.value=0;
            this.motor.connect(this.filter).connect(this.gain).connect(this.context.destination);this.motor.start();
        }
        if(this.context.state==='suspended')this.context.resume().catch(()=>{});
    }
    tone(frequency,duration=.1,volume=.04){
        if(!this.enabled||!this.context||this.context.state!=='running')return;
        const c=this.context,osc=c.createOscillator(),gain=c.createGain();osc.type='sine';osc.frequency.value=frequency;
        gain.gain.setValueAtTime(volume,c.currentTime);gain.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);
        osc.connect(gain).connect(c.destination);osc.start();osc.stop(c.currentTime+duration);
        osc.onended=()=>{osc.disconnect();gain.disconnect();};
    }
    update(engine){
        if(!this.context)return;
        const c=engine.player,active=engine.state==='racing'&&this.enabled;
        this.motor.frequency.setTargetAtTime(45+Math.abs(c.speed)*3.1,this.context.currentTime,.07);
        this.gain.gain.setTargetAtTime(active?.012+c.input.throttle*.009:0,this.context.currentTime,.05);
        if(active&&c.collisions>this.lastCollision){this.tone(80,.08,.02);this.lastCollision=c.collisions;}
    }
    dispose(){if(!this.context)return;this.motor.stop();this.motor.disconnect();this.filter.disconnect();this.gain.disconnect();this.context.close().catch(()=>{});this.context=null;}
}
