import {useEffect,useRef} from "react";

// Mock ESP32: pick one connected shipment every 4s and nudge its temperature.

export default function useSensorSimulation(setShipments,onUpdate){
  const onUpdateRef=useRef(onUpdate);
  onUpdateRef.current=onUpdate;

  useEffect(()=>{
    const timer=setInterval(()=>{
      setShipments(previous=>{
        const readable=previous.filter(item=>item.connection==="ok");
        if(!readable.length) return previous;

        const item=readable[Math.floor(Math.random()*readable.length)];
        const temperature=Number((item.temperature+(Math.random()*2-1)).toFixed(1));
        const history=[...item.history,temperature];
        if(history.length>6) history.shift();

        const updated={...item,temperature,connection:"ok",history};
        queueMicrotask(()=>onUpdateRef.current?.(updated));

        return previous.map(entry=>entry.id===item.id?updated:entry);
      });
    },4000);

    return()=>clearInterval(timer);
  },[setShipments]);
}
