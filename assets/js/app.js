const products = {
  1: {name:"Everyday Carry Tote", price:28500},
  2: {name:"Wireless Sound Headphones", price:45000},
  3: {name:"Sculpted Ceramic Vase", price:19900},
  4: {name:"Daily Care Essentials Set", price:32000}
};
let cart = [];
const money = n => "₦" + Number(n).toLocaleString("en-NG");
const $ = id => document.getElementById(id);

function updateCart(){
  $("cartCount").textContent = cart.reduce((sum,item)=>sum+item.qty,0);
  $("cartHeadingCount").textContent = `(${cart.reduce((sum,item)=>sum+item.qty,0)})`;
  $("cartSubtotal").textContent = money(cart.reduce((sum,item)=>sum+item.price*item.qty,0));
  const holder = $("cartItems");
  if(!cart.length){holder.innerHTML='<p class="empty-cart">Your bag is waiting for something lovely.</p>';return;}
  holder.innerHTML = cart.map(item=>`<div class="cart-row"><div><strong>${item.name}</strong><br><span>${item.qty} × ${money(item.price)}</span></div><div>${money(item.price*item.qty)}<br><button data-remove="${item.id}">Remove</button></div></div>`).join("");
}
function addToCart(id){
  const product = products[id];
  if(!product) return;
  const existing = cart.find(item=>item.id===Number(id));
  if(existing) existing.qty++;
  else cart.push({id:Number(id),...product,qty:1});
  updateCart();
}
document.querySelectorAll(".quick-add").forEach(button=>button.addEventListener("click",()=>addToCart(button.dataset.product)));
$("cartOpen").addEventListener("click",()=>{ $("cartDrawer").classList.add("open");$("cartOverlay").classList.add("open");$("cartDrawer").setAttribute("aria-hidden","false");});
function closeCart(){ $("cartDrawer").classList.remove("open");$("cartOverlay").classList.remove("open");$("cartDrawer").setAttribute("aria-hidden","true");}
$("cartClose").addEventListener("click",closeCart);
$("cartOverlay").addEventListener("click",closeCart);
$("cartItems").addEventListener("click",event=>{const id=event.target.dataset.remove;if(id){cart=cart.filter(item=>item.id!==Number(id));updateCart();}});
$("menuToggle").addEventListener("click",()=>{const open=$("mainNav").classList.toggle("open");$("menuToggle").setAttribute("aria-expanded",String(open));});
document.querySelectorAll(".main-nav a").forEach(link=>link.addEventListener("click",()=>{$("mainNav").classList.remove("open");$("menuToggle").setAttribute("aria-expanded","false");}));
$("searchToggle").addEventListener("click",()=>{$("searchPanel").classList.toggle("open");if($("searchPanel").classList.contains("open"))$("productSearch").focus();});
$("productSearch").addEventListener("input",event=>{const query=event.target.value.toLowerCase();document.querySelectorAll(".product-card").forEach(card=>{card.style.display=card.dataset.name.includes(query)?"":"none";});});
document.querySelectorAll(".filter-button").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll(".filter-button").forEach(b=>b.classList.remove("active"));button.classList.add("active");const filter=button.dataset.filter;document.querySelectorAll(".product-card").forEach(card=>{card.style.display=filter==="All"||card.dataset.category===filter?"":"none";});}));
document.querySelectorAll(".category-card").forEach(card=>card.addEventListener("click",()=>{const category=card.dataset.category;document.querySelectorAll(".filter-button").forEach(b=>{b.classList.toggle("active",b.dataset.filter===category);});document.querySelectorAll(".product-card").forEach(p=>p.style.display=p.dataset.category===category?"":"none");}));
$("newsletterForm").addEventListener("submit",event=>{event.preventDefault();$("newsletterMessage").textContent="Thanks for your interest! Newsletter signup will be connected during backend setup.";$("newsletterEmail").value="";});
$("year").textContent=new Date().getFullYear();
updateCart();
