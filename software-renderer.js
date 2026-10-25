import {Projector,RenderableFace,RenderableLine} from './vendor/Projector.js';
import {SRGBColorSpace} from './vendor/three.module.js';

// A depth-buffered Canvas renderer for devices without WebGL. It uses the
// same meshes, cameras and selection rays as the accelerated renderer.
export class SoftwareRenderer {
  constructor(){this.domElement=document.createElement('canvas');this.ctx=this.domElement.getContext('2d',{alpha:false});this.projector=new Projector();this.shadowMap={};this.textureCache=new WeakMap();this.materialCache=new WeakMap();}
  setPixelRatio(){}
  setSize(w,h){const scale=Math.min(1.2,1100/w);this.width=Math.max(1,Math.round(w*scale));this.height=Math.max(1,Math.round(h*scale));this.domElement.width=this.width;this.domElement.height=this.height;this.image=this.ctx.createImageData(this.width,this.height);this.depth=new Float32Array(this.width*this.height);}
  setAnimationLoop(callback){let last=0;const frame=time=>{if(time-last>65){last=time;callback(time);}requestAnimationFrame(frame);};requestAnimationFrame(frame);}
  getMaterial(m){if(this.materialCache.has(m))return this.materialCache.get(m);const c=m.color.clone().convertLinearToSRGB();const value={r:c.r*255,g:c.g*255,b:c.b*255,alpha:m.transparent?m.opacity:1,glow:m.emissiveIntensity||0,texture:null};if(m.map?.image){try{let tx=this.textureCache.get(m.map.image);if(!tx){const im=m.map.image,cv=document.createElement('canvas');cv.width=im.width;cv.height=im.height;const cx=cv.getContext('2d');cx.drawImage(im,0,0);tx={data:cx.getImageData(0,0,cv.width,cv.height).data,w:cv.width,h:cv.height};this.textureCache.set(im,tx);}value.texture={...tx,repeatX:m.map.repeat.x,repeatY:m.map.repeat.y,flipY:m.map.flipY};}catch{}}
    this.materialCache.set(m,value);return value;
  }
  render(scene,camera){if(!this.image)return;const pixels=this.image.data;this.depth.fill(Infinity);for(let i=0;i<pixels.length;i+=4){pixels[i]=241;pixels[i+1]=242;pixels[i+2]=233;pixels[i+3]=255;}
    const data=this.projector.projectScene(scene,camera,false,false),transparent=[],lines=[];
    for(const el of data.elements){if(el instanceof RenderableFace){const m=this.getMaterial(el.material);if(m.alpha<.99)transparent.push(el);else this.face(el,m);}else if(el instanceof RenderableLine)lines.push(el);}
    transparent.sort((a,b)=>b.z-a.z);for(const el of transparent)this.face(el,this.getMaterial(el.material));for(const el of lines)this.line(el);this.ctx.putImageData(this.image,0,0);
  }
  face(f,m){const n=f.normalModel;const light=Math.min(1.07,.66+Math.max(0,(n.x*2+n.y*6+n.z*2)/6.633)*.33+Math.max(0,(-n.x*2+n.y*3-n.z*3)/4.69)*.12+m.glow*.13);
    let verts=[f.v1,f.v2,f.v3].map((v,i)=>{const p=v.positionScreen;return{x:p.x*p.w,y:p.y*p.w,z:p.z*p.w,w:p.w,u:f.uvs[i]?.x||0,v:f.uvs[i]?.y||0};});
    // Clip against the near plane before dividing by w.
    const output=[];for(let i=0;i<verts.length;i++){const a=verts[i],b=verts[(i+1)%verts.length],da=a.z+a.w,db=b.z+b.w,insideA=da>=0,insideB=db>=0;if(insideA)output.push(a);if(insideA!==insideB){const t=da/(da-db),v={};for(const k of ['x','y','z','w','u','v'])v[k]=a[k]+(b[k]-a[k])*t;output.push(v);}}
    if(output.length<3)return;verts=output.map(p=>({x:(p.x/p.w*.5+.5)*this.width,y:(.5-p.y/p.w*.5)*this.height,z:p.z/p.w,iw:1/p.w,u:p.u/p.w,v:p.v/p.w}));for(let i=1;i<verts.length-1;i++)this.triangle(verts[0],verts[i],verts[i+1],m,light);
  }
  triangle(a,b,c,m,light){const w=this.width,h=this.height;const minX=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),maxX=Math.min(w-1,Math.ceil(Math.max(a.x,b.x,c.x))),minY=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),maxY=Math.min(h-1,Math.ceil(Math.max(a.y,b.y,c.y)));if(minX>maxX||minY>maxY)return;
    const area=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(area)<.01)return;const inv=1/area,ax=(b.y-c.y)*inv,ay=(c.x-b.x)*inv,bx=(c.y-a.y)*inv,by=(a.x-c.x)*inv;
    const depth=this.depth,pixels=this.image.data,tx=m.texture,alpha=m.alpha,invAlpha=1-alpha;
    const rr=m.r*light,gg=m.g*light,bb=m.b*light;
    for(let y=minY;y<=maxY;y++){let l1=ax*(minX+.5-c.x)+ay*(y+.5-c.y),l2=bx*(minX+.5-c.x)+by*(y+.5-c.y),index=y*w+minX;
      for(let x=minX;x<=maxX;x++,index++,l1+=ax,l2+=bx){const l3=1-l1-l2;if(l1<-.00001||l2<-.00001||l3<-.00001)continue;const z=l1*a.z+l2*b.z+l3*c.z;if(z>1||z< -1||z>depth[index]+.00000005)continue;const p=index*4;let r=rr,g=gg,bv=bb;
        if(tx){const iw=l1*a.iw+l2*b.iw+l3*c.iw;let u=(l1*a.u+l2*b.u+l3*c.u)/iw*tx.repeatX,v=(l1*a.v+l2*b.v+l3*c.v)/iw*tx.repeatY;u=((u%1)+1)%1;v=((v%1)+1)%1;if(tx.flipY)v=1-v;const at=(Math.min(tx.h-1,Math.floor(v*tx.h))*tx.w+Math.min(tx.w-1,Math.floor(u*tx.w)))*4;r=tx.data[at]*m.r/255*light;g=tx.data[at+1]*m.g/255*light;bv=tx.data[at+2]*m.b/255*light;}
        if(alpha<.99){pixels[p]=r*alpha+pixels[p]*invAlpha;pixels[p+1]=g*alpha+pixels[p+1]*invAlpha;pixels[p+2]=bv*alpha+pixels[p+2]*invAlpha;}else{depth[index]=z;pixels[p]=r;pixels[p+1]=g;pixels[p+2]=bv;}
      }
    }
  }
  line(el){const w=this.width,h=this.height,a=el.v1.positionScreen,b=el.v2.positionScreen,x1=(a.x*.5+.5)*w,y1=(.5-a.y*.5)*h,x2=(b.x*.5+.5)*w,y2=(.5-b.y*.5)*h,steps=Math.ceil(Math.max(Math.abs(x2-x1),Math.abs(y2-y1)));if(steps>10000||steps<1)return;const col=el.material.color.clone().convertLinearToSRGB(),depthTest=el.material.depthTest!==false;
    for(let i=0;i<=steps;i++){const t=i/steps,x=Math.round(x1+(x2-x1)*t),y=Math.round(y1+(y2-y1)*t),z=a.z+(b.z-a.z)*t;if(x<0||y<0||x>=w||y>=h||z< -1||z>1)continue;const at=y*w+x;if(depthTest&&z>this.depth[at]+.000001)continue;const p=at*4;this.image.data[p]=col.r*255;this.image.data[p+1]=col.g*255;this.image.data[p+2]=col.b*255;}
  }
}
