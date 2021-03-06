import { codeutilities, encodeTemplate } from "../../main/main";
import type { SelectionBlock, Template } from "../template";

window.onload = () => {
    (document.getElementById('send') as HTMLButtonElement).onclick = generateTheComment;
}

window.onkeydown = event => {
    if(event.key === "Enter"){
        (document.getElementById('send') as HTMLButtonElement).click();
    }
    if(event.key === "ArrowDown"){
        nextElement(1);
        return false;
    }
    if(event.key === "ArrowUp"){
        nextElement(-1);
        return false;
    }
}

function generateTheComment(){
    let code : Template = {"blocks":[{"id":"block","block":"control","args":{"items":[]},"action":"","target":"","inverted":""}]};
    (code['blocks'][0] as SelectionBlock)['action'] = (document.getElementById('action') as HTMLInputElement).value as any;
    (code['blocks'][0] as SelectionBlock)['target'] = (document.getElementById('target') as HTMLInputElement).value as any;
    (code['blocks'][0] as SelectionBlock)['inverted'] = (document.getElementById('inverted') as HTMLInputElement).value as any;
    codeutilities.send(
    JSON.stringify(
            {"type":"template","source":"DFOnline Comment Generator","data":
                JSON.stringify({"name":"§6Comment","data":encodeTemplate(JSON.stringify(code))})
            }
        )
    );
}


function nextElement(move = 1){
    let elements = [...(document.querySelectorAll('.comment') as unknown as Array<HTMLElement>)];
    let current = elements.findIndex(x => x === document.activeElement);
    let newIndex = (current + move) % elements.length;
    newIndex = newIndex < 0 ? elements.length - 1 : newIndex;
    elements[newIndex].focus();
}