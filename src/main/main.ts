import type { Template } from "../edit/template";
import { inflate, gzip } from "pako";
import { developerMenu } from "./developers";

export let cuopen = false;

/**
 * Shows a popup like the one saying "Couldn't connect to codeutilties"
 * @param message A message to show in the popup
 * @param type The type of message to show, changes style
 */
export function snackbar(message : string, type: 'error' | 'development' | '' = ''){
    const bar = document.createElement('span');
    bar.innerText = message;
    bar.classList.add(type);
    bar.onclick = event => {if(!bar.classList.contains('snackbartime')){(event.target as HTMLElement).classList.add('snackbarout')}};
    bar.onanimationend = event => (event.target as HTMLElement).remove();
    document.getElementById('snackbars').appendChild(bar);
    setTimeout(() => {if(!bar.classList.contains('snackbarout')){bar.classList.add('snackbartime')}},4000);
}

/**
 * Opens a menu such as the one seen as the login, import and items menu.
 * @param title The title of the menu
 * @param content HTMLElement object of what the menu should contain
 */
export function menu(title : string, content : HTMLElement = document.createElement('span')){
    let bg = document.createElement('div');
    bg.classList.add('background');
    setTimeout(() => {
        bg.onclick = event => {
            let hit = event.target as HTMLElement
            if(hit.classList.contains('background')){
                if(!hit.classList.contains('fade')){
                    hit.classList.add('fade')
                    hit.onanimationend = () => {
                        hit.remove()
                    }
                }
            }
        }
    },100)
    let screen = document.createElement('div');
    let obj = document.createElement('h1');
    obj.innerText = title;
    screen.appendChild(obj);
    screen.appendChild(content);
    (document.activeElement as HTMLElement).blur()
    bg.appendChild(screen);
    (document.getElementById('menus') as HTMLDivElement).appendChild(bg);
    return bg;
}

/**
 * @deprecated The plot for, and the backend for accounts are gone.
 */
export const user : {name: string, auth: string, token : string} = localStorage.user ? JSON.parse(localStorage.user) : undefined
/**
 * Login to DFOnline server with Username and Password.
 * @param name Username
 * @param auth Password
 * @deprecated The plot for, and the backend for accounts are gone.
 */
export function login(name : string, auth : string){
    fetch('https://WebBot.georgerng.repl.co/auth/login',{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name,
            auth,
        }),
    })
    .then(res => res.json())
    .then((json : {auth: string, name: string, token: string}) => {
        localStorage.user = JSON.stringify({auth,name,token:json.token});
        location.href = "./?message=Successfully logged you in!";
    })
    .catch(() => snackbar('Failed to log in.'));
}

/**
 * A function which does the start up activity for all pages, and returns some data.
 * @returns MouseInfo (HTMLElement, what I use for tooltips) urlParams (self generated data for the URL)
 */
export function startup(){
    let mouseInfo : HTMLDivElement = document.querySelector('#mouseinfo');
    document.body.onmousemove = e => {
        mouseInfo.style.top = String(e.clientY + 10) + 'px';
        mouseInfo.style.left = String(e.clientX + 10) + 'px';
    }
    let urlParams = new URLSearchParams(location.search)
    let urlMessage = urlParams.get('message');
    if(urlMessage){
        snackbar(urlMessage)
    }
    return {urlParams,mouseInfo}
}

export const codeutilities = new WebSocket('ws://localhost:31371/codeutilities/item');
codeutilities.onopen = () => {snackbar('Connected to CodeUtilities'); cuopen = true;}
codeutilities.onerror = () => {snackbar('Failed to connect to CodeUtilities'); cuopen = false;}

export function decodeTemplate(base64data : string) : Template{
    const compressData = atob(base64data);
    const uint = compressData.split('').map(function(e) {
        return e.charCodeAt(0);
    });
    const binData = new Uint8Array(uint);
    const string = inflate(binData,{to: 'string'});
    return JSON.parse(string);
}

export function encodeTemplate(codedata : string){
    let data = gzip(codedata);
    let data2 = String.fromCharCode.apply(null, new Uint16Array(data) as unknown as []);
    return btoa(data2);
}

export function stripColors(text : string){
    return text.replace(/[&??][\dA-FK-ORX]/gi,'');
}

export function MinecraftTextCompToCodes(component : string | object) : string{
    let workComponents : any;
    if(typeof component == 'string'){
        workComponents = JSON.parse(component);
    }
    else{
        workComponents = component;
    }
    console.log(workComponents);

    const codes : {[key: string]: string} = {
        "black": "0",
        "dark_blue": "1",
        "dark_green": "2",
        "dark_aqua": "3",
        "dark_red": "4",
        "dark_purple": "5",
        "gold": "6",
        "gray": "7",
        "dark_gray": "8",
        "blue": "9",
        "green": "a",
        "aqua": "b",
        "red": "c",
        "light_purple": "d",
        "yellow": "e",
        "white": "f",
        "obfuscated": "k",
        "bold": "l",
        "strikethrough": "m",
        "underline": "n",
        "italic": "o",
        "reset": "r"
    }

    let text = '\u00A7r';
    if(workComponents.bold){
        text += '\u00A7l';
    }
    if(workComponents.italic){
        text += '\u00A7o';
    }
    if(workComponents.underlined){
        text += '\u00A7n';
    }
    if(workComponents.strikethrough){
        text += '\u00A7m';
    }
    if(workComponents.obfuscated){
        text += '\u00A7k';
    }
    if(workComponents.color){
        if(workComponents.color.startsWith('#')){
            workComponents.color = '\u00A7x\u00A7' + workComponents.color.substr(1).split('').join('\u00A7');
        }
        text += '\u00A7' + codes[workComponents.color];
    }
    if(workComponents.text){
        text += workComponents.text;
    }
    if(workComponents.extra){
        workComponents.extra.forEach((e : string) => {
            text += MinecraftTextCompToCodes(e);
        })
    }

    return text;
}

/**
 * Converts text with & or ?? codes into colored HTML
 * @param text The text to format.
 * @param defaultColor The default color to use (just adds it to the start, requires the & or ??).
 * @param font The font to use, when unused it will just not change the font.
 * @returns An array of span elements which use css to add the formatting.
 */
export function minecraftColorHTML(text : string, defaultColor = '??r',font?:string) : Array<HTMLSpanElement>{
    const styleMap = {
        '0': {css: 'color: #000000;', reset: true},
        '1': {css: 'color: #0000aa;', reset: true},
        '2': {css: 'color: #00aa00;', reset: true},
        '3': {css: 'color: #00aaaa;', reset: true},
        '4': {css: 'color: #aa0000;', reset: true},
        '5': {css: 'color: #aa00aa;', reset: true},
        '6': {css: 'color: #ffaa00;', reset: true},
        '7': {css: 'color: #aaaaaa;', reset: true},
        '8': {css: 'color: #555555;', reset: true},
        '9': {css: 'color: #5555ff;', reset: true},
        'a': {css: 'color: #55ff55;', reset: true},
        'b': {css: 'color: #55ffff;', reset: true},
        'c': {css: 'color: #ff5555;', reset: true},
        'd': {css: 'color: #ff55ff;', reset: true},
        'e': {css: 'color: #ffff55;', reset: true},
        'f': {css: 'color: #ffffff;', reset: true},
        'l': {css: 'font-weight: bold;', reset: false},
        'n': {css: 'text-decoration: underline;', reset: false},
        'o': {css: 'font-style: italic;', reset: false},
        'm': {css: 'text-decoration: line-through;', reset: false},
        'k': {css: 'animation: fadepulse 1s infinite alternate ease-in-out;', reset: false},
        'r': {css: 'color: #ffffff;', reset: true},
        'x': {css: '', reset: true},
    };
    let last = styleMap['r'].css;
    let hexColor = 0;
    return (defaultColor + text).replace(/[????]/g, '').match(/[&??][\dA-FK-ORX].*?(?=[&??][\dA-FK-ORX])|[&??][\dA-FK-ORX].*/gi).map((str : string) => {
            let newStr = str.replace(/^[&??][\dA-FK-ORX]/gi,'');
            let element = document.createElement('span');
            element.innerText = newStr;
            let style = styleMap[str[1] as 'r'];
            if(style.reset){
                if(str[1] === 'x'){
                    hexColor = 6;
                    last = 'color: #';
                }
                else if(hexColor > 0){
                    last += str[1];
                    console.log(str[1]);
                    if(hexColor === 1){
                        last += ';';
                    }
                }
                else last = style.css;
            }
            else{
                element.style.cssText = element.style.cssText + last;
                last = element.style.cssText + style.css;
            }
            element.style.cssText = style.css + last;
            if(font){
                element.style.fontFamily = font;
            }
            return element;
        }
    )
        .filter(x => x.innerText !== '')
}


/**
 * Edits a number to look like a df one, where there usually is a .0 after things.
 * @param num The number to work this on
 * @param accuray How many digits
 * @returns A number with edits applied
 */
export function dfNumber(num : number | string,accuray = 3){
    return Number(num).toPrecision(accuray).replace(/(?<=.\d)0$/,'');
}

// if apiEndpoint is not set, it will use the default one
if(sessionStorage.getItem('apiEndpoint') === null){
    sessionStorage.setItem('apiEndpoint','https://dfonline-backend.georgerng.repl.co/api/'); // if you don't want IP logging I will run the backend on replit so you can know that "I am not running different code" then on the repo. // Next up is a another repl which is a static server so you can't think that the main website is logging you (it's a static in it self) and create a domain record to lead to that instead of the static set up by the host.
}

document.addEventListener('keydown',(e) => {
    if(e.key === 'D' && e.shiftKey && e.ctrlKey && e.altKey){
        if   (!developerMenu.isOpen) developerMenu.open();
        else                         developerMenu.close();
        
    }
})

export const templateLike = /H4sIA*[0-9A-Za-z+/]*={0,2}/;