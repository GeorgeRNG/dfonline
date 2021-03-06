import { ActDB, code, contextMenu, findBlockTag, findBlockTagOption, mouseInfo, Sounds, tree, userMeta } from "../edit";
import { BlockTag, GameValue, g_valSelection, Item, ParsedItem, Particle, Potion, SelectionBlock, SelectionValues, Sound, SubActionBlock, Variable, Vector, Location as DFLocation, Text, Number as DFNumber, DataBlock } from "../../template";
import { menu, minecraftColorHTML, stripColors } from "../../../main/main";
import { isDeveloperMode } from "../../../main/developers";
import { parse } from "nbt-ts";
import tooltip from "./tooltip";

/**
 * Opens a chest menu. If one is already open the previous one is overwritted to skip any animations.
 * @param id The id of the block to open the chest of.
 * @returns The menu element opened.
 */
export default function chestMenu(id : number){
	let block : SubActionBlock | SelectionBlock = code.blocks[id] as any;
	const dbBlockType = ActDB.codeblocks.find(b => b.identifier === block.block);
	if(block.args !== undefined){
		let menuDiv = document.createElement('div');
		menuDiv.id = 'chest';
		[...Array(27).keys()].forEach((slotID) => { // each slot
			let slot = document.createElement('div');
			slot.classList.add('slot');
			const itemIndex = block.args.items.findIndex(i => i.slot == slotID)
			let item = (block.args.items[itemIndex]);
			let itemElement = document.createElement('div');
			itemElement.style.backgroundImage = "";
			if(item){ // if there in an item
				slot.id = String(itemIndex);
				slot.classList.add('notEmpty');
				if(item.item.id === 'bl_tag'){ // block tags
					itemElement.draggable = false;
					itemElement.ondragstart = e => {e.preventDefault();
						return false;
					};
					itemElement.oncontextmenu = e => {
						e.preventDefault();
						userMeta.value = Number((e.target as HTMLDivElement).parentElement.id);
						contextMenu.innerHTML = '';
						contextMenu.style.left = String(e.clientX) + 'px';
						contextMenu.style.top = String(e.clientY) + 'px';
						contextMenu.style.display = 'grid';
						contextMenu.focus();
						const tags = findBlockTag(block.block, block.action, (item.item as BlockTag).data.tag);
						tags.options.forEach(o => {
							const option = document.createElement('button');
							option.innerText = o.name;
							option.onclick = () => {
								(item.item as BlockTag).data.option = o.name;
								chestMenu(id);
							};
							contextMenu.appendChild(option);
						});
					}
				}
				else { // events on general items.
					itemElement.draggable = true;
					itemElement.ondragstart = event => {
						event.stopPropagation();
		 				userMeta.type = 'item';
						userMeta.value = Number((event.target as HTMLDivElement).parentElement.id);
					}
					itemElement.ondragover = e => e.preventDefault();
					itemElement.ondrop = event => {
						let dropOn = block.args.items[Number((event.target as HTMLDivElement).parentElement.id)]; // the item you just dropped onto
						let dropping = block.args.items[userMeta.value];
						const swap = dropOn.slot;
						dropOn.slot = dropping.slot;
						dropping.slot = swap;
						chestMenu(id);
					}
					itemElement.oncontextmenu = e => { // the right click menu :D
						e.preventDefault();
						userMeta.value = Number((e.target as HTMLDivElement).parentElement.id);
						contextMenu.innerHTML = '';
						contextMenu.style.left = String(e.clientX) + 'px';
						contextMenu.style.top = String(e.clientY) + 'px';
						contextMenu.style.display = 'grid';
						contextMenu.focus();

						let valueButton = document.createElement('button');
						valueButton.innerHTML = 'V<u>a</u>lue'
						valueButton.onclick = () => { // main value
							setTimeout(() => {
								contextMenu.style.display = 'grid';

								if(item.item.id === 'num' || item.item.id === 'txt' || item.item.id === 'var'){
									let value = document.createElement('input');
									value.value = item.item.data.name;
									value.onkeydown = e => {
										if(e.key === 'Enter'){
											if(!e.shiftKey){
												(item.item.data as {name: string}).name = value.value;
												chestMenu(id);
												contextMenu.click();
											}
											else{
												value.value += '\n';
											}
										}
										if(e.key === 'Escape'){
											contextMenu.click();
										}
									}
									value.onclick = e => e.stopPropagation();
									contextMenu.append(value);
									value.focus();
									if(item.item.id === 'var'){
										const scope = document.createElement('select');
										scope.onchange = () => {
											(item.item.data as {scope: string}).scope = scope.value;
											chestMenu(id);
										}
										scope.onclick = e => e.stopPropagation();
										scope.innerHTML = `
											<option value="unsaved">GAME</option>
											<option value="saved">SAVE</option>
											<option value="local">LOCAL</option>
										`
										scope.value = (item.item.data as {scope: string}).scope;
										contextMenu.append(scope);
									}
								}

								else if(item.item.id === 'loc'){
									let locationInput = document.createElement('div');
									locationInput.onclick = e => e.stopPropagation();
									locationInput.onkeydown = e => {
										if(isDeveloperMode()) console.log(e);
										if(e.key === 'Enter'){
											(item.item as unknown as DFLocation).data.loc.x = Number(xInput.value);
											(item.item as unknown as DFLocation).data.loc.y = Number(yInput.value);
											(item.item as unknown as DFLocation).data.loc.z = Number(zInput.value);
											(item.item as unknown as DFLocation).data.loc.pitch = Number(pitchInput.value);
											(item.item as unknown as DFLocation).data.loc.yaw = Number(yawInput.value);
											contextMenu.click();
										}
										if(e.key === 'Escape'){
											contextMenu.click();
										}
									}
									locationInput.style.display = 'grid';
									locationInput.style.gridTemplateRows = '1fr 1fr 1fr 1fr';

									let xLabel = document.createElement('label');
									xLabel.innerHTML = 'X: ';
									let xInput = document.createElement('input');
									xInput.type = 'number';
									xInput.value = String(item.item.data.loc.x);
									xLabel.append(xInput);
									locationInput.append(xLabel);

									let yLabel = document.createElement('label');
									yLabel.innerHTML = 'Y: ';
									let yInput = document.createElement('input');
									yInput.type = 'number';
									yInput.value = String(item.item.data.loc.y);
									yLabel.append(yInput);
									locationInput.append(yLabel);

									let zLabel = document.createElement('label');
									zLabel.innerHTML = 'Z: ';
									let zInput = document.createElement('input');
									zInput.type = 'number';
									zInput.value = String(item.item.data.loc.z);
									zLabel.append(zInput);
									locationInput.append(zLabel);

									let pitchLabel = document.createElement('label');
									pitchLabel.innerHTML = 'Pitch: ';
									let pitchInput = document.createElement('input');
									pitchInput.type = 'number';
									pitchInput.value = String(item.item.data.loc.pitch);
									pitchLabel.append(pitchInput);
									locationInput.append(pitchLabel);

									let yawLabel = document.createElement('label');
									yawLabel.innerHTML = 'Yaw: ';
									let yawInput = document.createElement('input');
									yawInput.type = 'number';
									yawInput.value = String(item.item.data.loc.yaw);
									yawLabel.append(yawInput);
									locationInput.append(yawLabel);

									contextMenu.append(locationInput);
									xLabel.focus();
								}

								else if(item.item.id === 'vec'){
									let vectorEdit = document.createElement('div');
									vectorEdit.onclick = e => e.stopPropagation();
									vectorEdit.onkeydown = e => {
										if(e.key === 'Enter'){
											(item.item as unknown as Vector).data.x = Number(xVecInput.value);
											(item.item as unknown as Vector).data.y = Number(yVecInput.value);
											(item.item as unknown as Vector).data.z = Number(zVecInput.value);
											chestMenu(id);
											contextMenu.click();
										}
										if(e.key === 'Escape'){
											contextMenu.click();
										}
									}
									vectorEdit.style.display = 'grid';
									vectorEdit.style.gridTemplateRows = '1fr 1fr 1fr';

									let xVecLabel = document.createElement('label');
									xVecLabel.innerHTML = 'X: ';
									let xVecInput = document.createElement('input');
									xVecInput.type = 'number';
									xVecInput.value = String(item.item.data.x);
									xVecLabel.append(xVecInput);
									vectorEdit.append(xVecLabel);

									let yVecLabel = document.createElement('label');
									yVecLabel.innerHTML = 'Y: ';
									let yVecInput = document.createElement('input');
									yVecInput.type = 'number';
									yVecInput.value = String(item.item.data.y);
									yVecLabel.append(yVecInput);
									vectorEdit.append(yVecLabel);

									let zVecLabel = document.createElement('label');
									zVecLabel.innerHTML = 'Z: ';
									let zVecInput = document.createElement('input');
									zVecInput.type = 'number';
									zVecInput.value = String(item.item.data.z);
									zVecLabel.append(zVecInput);
									vectorEdit.append(zVecLabel);

									contextMenu.append(vectorEdit);
									xVecLabel.focus();
								}

								else if(item.item.id === 'snd'){
									const soundEdit = document.createElement('div');
									soundEdit.onclick = e => e.stopPropagation();
									soundEdit.onkeydown = e => {
										if(e.key === 'Enter' || e.key === 'Escape'){
											contextMenu.click();
										}
									}
									soundEdit.style.display = 'grid';
									soundEdit.style.gridTemplateRows = '1fr 1fr 1fr';

									const soundValue = document.createElement('button');
									soundValue.innerHTML = 'Select Sound';
									soundValue.onclick = () => { // Select sound menu here because I am always looking for this piece of code.
										function soundTab(path : string[] = []){
											contextMenu.innerHTML = '';
											const soundSelect = document.createElement('div');
											soundSelect.style.display = 'grid';
											
											let sounds = Sounds;
											for(const element of path){
												sounds = sounds[element] as tree;
											}
											Object.entries(sounds).forEach(([key, value]) => {
												const button = document.createElement('button');
												button.innerHTML = key;
												button.onclick = e => {
													e.stopPropagation();
													if(typeof value === 'string'){
														// get the new name from the icon name, which df uses for some reason.
														const newSound = ActDB.sounds.find(s => s.sound === value).icon.name;
														(item.item as unknown as Sound).data.sound = stripColors(newSound);
														soundValue.innerHTML = value;
														contextMenu.click();
													}
													else{
														soundTab([...path, key]);
													}
												}
												soundSelect.append(button);
											});
											contextMenu.append(soundSelect);
										}

										soundTab();
									}
									soundEdit.append(soundValue);

									const pitchLabel = document.createElement('label');
									pitchLabel.innerHTML = 'Pitch: ';
									const pitchInput = document.createElement('input');
									pitchInput.type = 'number';
									pitchInput.value = String(item.item.data.pitch);
									// set the input to be limited from 0 to 2
									pitchInput.oninput = () => {
										if(Number(pitchInput.value) < 0){
											pitchInput.value = '0';
										}
										else if(Number(pitchInput.value) > 2){
											pitchInput.value = '2';
										}

										(item.item as unknown as Sound).data.pitch = Number(pitchInput.value);
									}
									pitchLabel.append(pitchInput);
									soundEdit.append(pitchLabel);

									const volumeLabel = document.createElement('label');
									volumeLabel.innerHTML = 'Volume: ';
									const volumeInput = document.createElement('input');
									volumeInput.type = 'number';
									volumeInput.value = String(item.item.data.vol);
									// on input save the value to the item
									volumeInput.oninput = () => {
										(item.item as unknown as Sound).data.vol = Number(volumeInput.value);
									}
									volumeLabel.append(volumeInput);
									soundEdit.append(volumeLabel);

									contextMenu.append(soundEdit);
								}

								else if(item.item.id === 'g_val'){
									const gameValueEdit = document.createElement('div');
									gameValueEdit.style.display = 'grid';
									gameValueEdit.style.gridTemplateRows = '1fr 1fr';

									const selectValueButton = document.createElement('button');
									selectValueButton.innerHTML = 'Select Value';
									selectValueButton.onclick = e => {
										e.stopPropagation();
										contextMenu.innerHTML = '';

										const selectValue = document.createElement('div');
										selectValue.style.display = 'grid';
										ActDB.gameValueCategories.forEach(category => {
											if(category.icon.name.includes('Values')){
												const button = document.createElement('button');
												button.innerHTML = minecraftColorHTML(category.icon.name)[0].outerHTML;
												button.onclick = e => {
													selectValue.innerHTML = '';
													e.stopPropagation();
													ActDB.gameValues.forEach(value => {
														if(value.category === category.identifier){
															const valueButton = document.createElement('button');
															valueButton.innerHTML = minecraftColorHTML(value.icon.name)[0].outerHTML;
															valueButton.onclick = () => {
																(item.item as unknown as GameValue).data.type = stripColors(value.icon.name);
																contextMenu.click();
															}
															selectValue.append(valueButton);
														}
													});
												}
												selectValue.append(button);

												contextMenu.append(selectValue);
											}
										});
									}
									gameValueEdit.append(selectValueButton);

									const targetLabel = document.createElement('label');
									targetLabel.innerHTML = 'Selection: ';
									targetLabel.onclick = e => e.stopPropagation();
									const targetInput = document.createElement('select');
									targetInput.onchange = e => {
										e.stopPropagation();
										(item.item as unknown as GameValue).data.target = (targetInput.value as g_valSelection);
									}
									SelectionValues.forEach(s => {
										// ignore the empty and "AllPlayers" selections
										if(s !== 'AllPlayers' && s !== ''){
											const option = document.createElement('option');
											option.value = s;
											option.innerHTML = s;
											// LastEntity has a custom display name of "Last-Spawned Entity"
											if(s === 'LastEntity'){
												option.innerHTML = 'Last-Spawned Entity';
											}
											if(s === (item.item as unknown as GameValue).data.target){
												option.selected = true;
											}
											targetInput.append(option);
										}
									});
									targetInput.value = (item.item as unknown as GameValue).data.target;
									targetLabel.append(targetInput);
									gameValueEdit.append(targetLabel);

									contextMenu.append(gameValueEdit);
								}

								else if(item.item.id === 'part'){
									const partEdit = document.createElement('div');
									partEdit.style.display = 'grid';

									const selectPartButton = document.createElement('button');
									selectPartButton.innerHTML = 'Select Particle';
									selectPartButton.onclick = e => {
										partEdit.innerHTML = '';
										e.stopPropagation();
										const categories = [
											"Ambient Particles",
											"Entity Behavior Particles",
											"Ambient Entity Particles",
											"Entity Attack Particles",
											"Liquid Particles",
											"Ambient Block Particles",
											"Block Behavior Particles"
										];
										categories.forEach(category => {
											const categoryButton = document.createElement('button');
											categoryButton.innerHTML = category;
											categoryButton.onclick = e => {
												e.stopPropagation();
												partEdit.innerHTML = '';
												// all the particles are in particleCategories for some reason.
												ActDB.particleCategories.forEach(particle => {
													if(particle.category === category){
														const particleButton = document.createElement('button');
														particleButton.innerHTML = particle.icon.name;
														particleButton.onclick = () => {
															(item.item as unknown as Particle).data.particle = particle.icon.name;
															contextMenu.click();
														}
														partEdit.append(particleButton);
													}
												});
											}
											partEdit.append(categoryButton);
										});
									}
									partEdit.append(selectPartButton);
									
									partEdit.append(document.createElement('hr'));

									const amountLabel = document.createElement('label');
									amountLabel.innerHTML = 'Amount: ';
									amountLabel.onclick = e => e.stopPropagation();
									const amountInput = document.createElement('input');
									amountInput.type = 'number';
									amountInput.value = String((item.item as unknown as Particle).data.cluster.amount);
									amountInput.onchange = () => {
										(item.item as unknown as Particle).data.cluster.amount = Number(amountInput.value);
									}
									amountLabel.append(amountInput);
									partEdit.append(amountLabel);

									const spreadLabel = document.createElement('label');
									spreadLabel.innerHTML = 'Spread: ';
									spreadLabel.onclick = e => e.stopPropagation();
									spreadLabel.style.display = 'flex';
									const spreadInputs = document.createElement('div');
									spreadInputs.style.display = 'flex';
									const spreadHorInput = document.createElement('input');
									spreadHorInput.type = 'number';
									spreadHorInput.value = String((item.item as unknown as Particle).data.cluster.horizontal);
									spreadHorInput.onchange = () => {
										(item.item as unknown as Particle).data.cluster.horizontal = Number(spreadHorInput.value);
									}
									spreadInputs.append(spreadHorInput);
									const spreadVerInput = document.createElement('input');
									spreadVerInput.type = 'number';
									spreadVerInput.value = String((item.item as unknown as Particle).data.cluster.vertical);
									spreadVerInput.onchange = () => {
										(item.item as unknown as Particle).data.cluster.vertical = Number(spreadVerInput.value);
									}
									spreadInputs.append(spreadVerInput);
									spreadLabel.append(spreadInputs);
									partEdit.append(spreadLabel);

									const dbParticle = ActDB.particleCategories.find(particle => particle.icon.name === (item.item as Particle).data.particle);

									if(dbParticle.fields.length > 0){
										partEdit.append(document.createElement('hr'));
										if(dbParticle.fields.includes('Color')){
											const colorLabel = document.createElement('label');
											colorLabel.innerHTML = 'Color: ';
											colorLabel.onclick = e => e.stopPropagation();
											const colorInput = document.createElement('input');
											colorInput.type = 'color';
											colorInput.value = item.item.data.data.rgb.toString(16);
											colorInput.onchange = () => {
												(item.item as Particle).data.data.rgb = parseInt(colorInput.value.replace('#', ''), 16);
											}
											colorLabel.append(colorInput);
											partEdit.append(colorLabel);
										}
										if(dbParticle.fields.includes('Color Variation')){
											const colorVariationLabel = document.createElement('label');
											colorVariationLabel.innerHTML = 'Color Variation: ';
											colorVariationLabel.onclick = e => e.stopPropagation();
											const colorVariationInput = document.createElement('input');
											colorVariationInput.type = 'number';
											colorVariationInput.value = String(item.item.data.data.colorVariation);
											colorVariationInput.onchange = () => {
												// it's a percentage so limit it as such
												let returnValue = true;
												if(Number(colorVariationInput.value) > 100){
													colorVariationInput.value = '100';
													returnValue = false;
												}
												if(Number(colorVariationInput.value) < 0){
													colorVariationInput.value = '0';
													returnValue = false;
												}
												(item.item as Particle).data.data.colorVariation = Number(colorVariationInput.value);
												return returnValue;
											}
											colorVariationLabel.append(colorVariationInput);
											partEdit.append(colorVariationLabel);
										}

										if(dbParticle.fields.includes('Motion')){
											const MotionLabel = document.createElement('label');
											MotionLabel.innerHTML = 'Motion: ';
											MotionLabel.onclick = e => e.stopPropagation();
											MotionLabel.style.display = 'flex';
											const MotionInputs = document.createElement('div');
											MotionInputs.style.display = 'flex';
											const MotionXInput = document.createElement('input');
											MotionXInput.type = 'number';
											MotionXInput.value = String(item.item.data.data.x);
											MotionXInput.onchange = () => {
												(item.item as Particle).data.data.x = Number(MotionXInput.value);
											}
											MotionInputs.append(MotionXInput);
											const MotionYInput = document.createElement('input');
											MotionYInput.type = 'number';
											MotionYInput.value = String(item.item.data.data.y);
											MotionYInput.onchange = () => {
												(item.item as Particle).data.data.y = Number(MotionYInput.value);
											}
											MotionInputs.append(MotionYInput);
											const MotionZInput = document.createElement('input');
											MotionZInput.type = 'number';
											MotionZInput.value = String(item.item.data.data.z);
											MotionZInput.onchange = () => {
												(item.item as Particle).data.data.z = Number(MotionZInput.value);
											}
											MotionInputs.append(MotionZInput);
											MotionLabel.append(MotionInputs);
											partEdit.append(MotionLabel);
										}
										if(dbParticle.fields.includes('Motion Variation')){
											const MotionVariationLabel = document.createElement('label');
											MotionVariationLabel.innerHTML = 'Motion Variation: ';
											MotionVariationLabel.onclick = e => e.stopPropagation();
											const MotionVariationInput = document.createElement('input');
											MotionVariationInput.type = 'number';
											MotionVariationInput.value = String(item.item.data.data.motionVariation);
											MotionVariationInput.onchange = e => {
												// it's a percentage, so limit it to such
												let returnValue = true;
												if(Number(MotionVariationInput.value) > 100){
													MotionVariationInput.value = '100';
													e.preventDefault();
													returnValue = false;
												}
												if(Number(MotionVariationInput.value) < 0){
													MotionVariationInput.value = '0';
													e.preventDefault();
													returnValue = false;
												}
												(item.item as Particle).data.data.motionVariation = Number(MotionVariationInput.value);
												return returnValue;
											}
											MotionVariationLabel.append(MotionVariationInput);
											partEdit.append(MotionVariationLabel);
										}

										if(dbParticle.fields.includes('Size')){
											const SizeLabel = document.createElement('label');
											SizeLabel.innerHTML = 'Size: ';
											SizeLabel.onclick = e => e.stopPropagation();
											const SizeInput = document.createElement('input');
											SizeInput.type = 'number';
											SizeInput.value = String(item.item.data.data.size);
											SizeInput.onchange = () => {
												(item.item as Particle).data.data.size = Number(SizeInput.value);
											}
											SizeLabel.append(SizeInput);
											partEdit.append(SizeLabel);
										}
										if(dbParticle.fields.includes('Size Variation')){
											const SizeVariationLabel = document.createElement('label');
											SizeVariationLabel.innerHTML = 'Size Variation: ';
											SizeVariationLabel.onclick = e => e.stopPropagation();
											const SizeVariationInput = document.createElement('input');
											SizeVariationInput.type = 'number';
											SizeVariationInput.value = String(item.item.data.data.sizeVariation);
											SizeVariationInput.onchange = () => {
												// it's a percentage, so limit it to such
												if(Number(SizeVariationInput.value) > 100){
													SizeVariationInput.value = '100';
												}
												if(Number(SizeVariationInput.value) < 0){
													SizeVariationInput.value = '0';
												}
												(item.item as Particle).data.data.sizeVariation = Number(SizeVariationInput.value);
											}
											SizeVariationLabel.append(SizeVariationInput);
											partEdit.append(SizeVariationLabel);
										}

										if(dbParticle.fields.includes('Material')){
											const MaterialLabel = document.createElement('label');
											MaterialLabel.innerHTML = 'Material: ';
											MaterialLabel.onclick = e => e.stopPropagation();
											const MaterialInput = document.createElement('input');
											MaterialInput.type = 'text';
											MaterialInput.value = String(item.item.data.data.material);
											MaterialInput.onchange = () => {
												(item.item as Particle).data.data.material = MaterialInput.value;
											}
											MaterialLabel.append(MaterialInput);
											partEdit.append(MaterialLabel);
										}
									}

									contextMenu.append(partEdit);
								}

								else if(item.item.id === 'pot'){
									const potionEdit = document.createElement('div');
									potionEdit.style.display = 'grid';

									const potionTypeButton = document.createElement('button');
									potionTypeButton.innerHTML = 'Set Potion';
									potionTypeButton.onclick = e => {
										e.stopPropagation();
										potionEdit.innerHTML = '';
										ActDB.potions.forEach(potion => {
											const potionTypeButton = document.createElement('button');
											potionTypeButton.innerHTML = minecraftColorHTML(potion.icon.name)[0].outerHTML;
											potionTypeButton.onclick = () => {
												potionEdit.append(potionTypeButton);
												(item.item as Potion).data.pot = stripColors(potion.icon.name);
											}
											potionEdit.append(potionTypeButton);
										});
									}
									potionEdit.append(potionTypeButton);

									const potionAmplifierLabel = document.createElement('label');
									potionAmplifierLabel.innerHTML = 'Amplifier: ';
									potionAmplifierLabel.onclick = e => e.stopPropagation();
									const potionAmplifierInput = document.createElement('input');
									potionAmplifierInput.type = 'number';
									potionAmplifierInput.value = String(item.item.data.amp);
									potionAmplifierInput.onchange = () => {
										// it's limited between -255 and 255
										if(Number(potionAmplifierInput.value) > 255){
											potionAmplifierInput.value = '255';
										}
										if(Number(potionAmplifierInput.value) < -255){
											potionAmplifierInput.value = '-255';
										}
										(item.item as Potion).data.amp = Number(potionAmplifierInput.value);
									}
									potionAmplifierLabel.append(potionAmplifierInput);
									potionEdit.append(potionAmplifierLabel);
								
									const potionDurationLabel = document.createElement('label');
									potionDurationLabel.innerHTML = 'Duration: ';
									potionDurationLabel.onclick = e => e.stopPropagation();
									const potionDurationInput = document.createElement('input');
									potionDurationInput.type = 'number';
									potionDurationInput.value = String(item.item.data.dur);
									potionDurationInput.onchange = () => {
										// it can't be negetive
										if(Number(potionDurationInput.value) < 0){
											potionDurationInput.value = '0';
										}
										(item.item as Potion).data.dur = Number(potionDurationInput.value);
									}
									potionDurationLabel.append(potionDurationInput);
									potionEdit.append(potionDurationLabel);

									const potionDurationInfo = document.createElement('p');
									potionDurationInfo.innerText = 'Duration is in ticks, where 20 ticks is a second.\nThat means seconds ?? 20 = ticks.';
									potionDurationInfo.style.fontSize = '0.8em';
									potionDurationInfo.style.margin = '0';
									potionDurationInfo.style.marginTop = '0.5em';
									potionDurationInfo.style.padding = '0';
									potionDurationInfo.style.fontStyle = 'italic';
									potionDurationInfo.style.color = '#888';
									potionEdit.append(potionDurationInfo);

									contextMenu.append(potionEdit);
								}
							})
						}
						userMeta.ctxKeys['a'] = valueButton;
						contextMenu.append(valueButton);
						contextMenu.append(document.createElement('hr'));

						let deleteButton = document.createElement('button');
						deleteButton.innerHTML = '<u>D</u>elete';
						deleteButton.onclick = () => {
							block.args.items.splice(userMeta.value,1);
							chestMenu(id)
						}
						userMeta.ctxKeys['d'] = deleteButton;
						contextMenu.append(deleteButton);
					}
				}
				{ // the textures. epic
					let count;
					if(item.item.id === 'txt'){
						itemElement.style.backgroundImage = 'url(https://dfonline.dev/public/images/BOOK.png)';
					}
					else if(item.item.id === 'num'){
						itemElement.style.backgroundImage = 'url(https://dfonline.dev/public/images/SLIME_BALL.png)';
						count = document.createElement('span');
						count.innerText = item.item.data.name;
						count.style.color = "rgb(255, 85, 85)"
						itemElement.append(count);
					}
					else if(item.item.id === 'loc'){
						itemElement.style.backgroundImage = 'url(https://dfonline.dev/public/images/PAPER.png)';
					}
					else if (item.item.id === 'g_val'){
						itemElement.style.backgroundImage = 'url(https://dfonline.dev/public/images/NAME_TAG.png)';
					}
					else if (item.item.id === 'part'){
						itemElement.style.backgroundImage = 'url(https://dfonline.dev/public/images/WHITE_DYE.png)';
					}
					else if (item.item.id === 'pot'){
						itemElement.style.backgroundImage = 'url(https://dfonline.dev/public/images/DRAGON_BREATH.png)';
					}
					else if (item.item.id === 'snd'){
						itemElement.style.backgroundImage = 'url(https://dfonline.dev/public/images/NAUTILUS_SHELL.png)';
					}
					else if (item.item.id === 'var'){
						count = document.createElement('span');
						count.innerText = {"unsaved": "G", "saved": "S", "local": "L"}[(item.item as Variable).data.scope];
						count.style.color = {"unsaved": "rgb(170, 170, 170)", "saved": "rgb(255, 255, 85)", "local": "rgb(85, 255, 85)"}[(item.item as Variable).data.scope];
						itemElement.append(count);
						itemElement.style.backgroundImage = 'url(https://dfonline.dev/public/images/MAGMA_CREAM.png)';
					}
					else if (item.item.id === 'vec'){
						count = document.createElement('span');
						count.innerText = 'X: ' + item.item.data.x + '\nY: ' + item.item.data.y + '\nZ: ' + item.item.data.z;
						count.style.color = "rgb(255, 85, 85)";
						count.style.textShadow = "1px 1px 1px #000";
						count.style.fontSize = '0.8em';
						itemElement.append(count);
						itemElement.style.backgroundImage = 'url(https://dfonline.dev/public/images/PRISMARINE_SHARD.png)';
					}
					else if (item.item.id === 'item'){
						let data = parse(item.item.data.item) as unknown as ParsedItem;
						itemElement.style.backgroundImage = `url(https://dfonline.dev/public/images/${data.id.toUpperCase().replace('MINECRAFT:','')}.png)`;
						if(data.Count.value > 1){
							count = document.createElement('span');
							count.innerText = String(data.Count.value);
							itemElement.append(count);
						}
					}
					else if (item.item.id === 'bl_tag'){
						try{
							itemElement.style.backgroundImage = 'url(https://dfonline.dev/public/images/' + (findBlockTagOption(block.block,block.action,item.item.data.tag,item.item.data.option).icon.material) + '.png)';
						}
						catch{
							itemElement.style.backgroundImage = 'url(https://dfonline.dev/public/images/BARRIER.png)';
							itemElement.classList.add('fadepulse');
						}
					}
					else {
						itemElement.style.backgroundImage = 'url(https://dfonline.dev/public/images/BARRIER.png)';
						itemElement.classList.add('fadepulse');
					}
				}
				itemElement.onmousemove = () => tooltip(item, block);
				itemElement.onmouseleave = () => {mouseInfo.style.display = 'none';}
			}
			else { // if there isn't an item.
				itemElement.id = 'empty' + String(slotID);
				itemElement.classList.add('empty');
				itemElement.ondragover = e => e.preventDefault();
				itemElement.ondrop = event => {
					let target = event.target as HTMLDivElement
					block.args.items[userMeta.value].slot = Number(target.id.replace('empty',''));
					chestMenu(id);
				}
				itemElement.onclick = (e) => {
					userMeta.value = slotID;

					e.preventDefault();
					e.stopPropagation();

					contextMenu.innerHTML = '';
					contextMenu.style.display = 'block';
					contextMenu.style.left = e.clientX + 'px';
					contextMenu.style.top = e.clientY + 'px';

					const workItem = (item : Item) => {
						block.args.items.push({
							slot: slotID,
							item: item
						});
						let menu = chestMenu(id);

						setTimeout(() => {
							(menu.querySelectorAll('*.slot > .item')[slotID] as HTMLElement).oncontextmenu(e);
							setTimeout(() => {
								userMeta.ctxKeys['a'].click();
							}, 0);
						});
					}

					const varItem = document.createElement('button');
					varItem.classList.add('newValue');
					varItem.style.backgroundImage = 'url("https://dfonline.dev/public/images/MAGMA_CREAM.png")';
					varItem.onclick = () => {
						let newItem : Variable = {
							id: 'var',
							data: {
								scope: 'unsaved',
								name: '',
							}
						}
						workItem(newItem);
					}
					contextMenu.append(varItem);

					const textItem = document.createElement('button');
					textItem.classList.add('newValue');
					textItem.style.backgroundImage = 'url("https://dfonline.dev/public/images/BOOK.png")';
					textItem.onclick = () => {
						let newItem : Text = {
							id: 'txt',
							data: {
								name: '',
							}
						}
						workItem(newItem);
					}
					contextMenu.append(textItem);

					const numItem = document.createElement('button');
					numItem.classList.add('newValue');
					numItem.style.backgroundImage = 'url("https://dfonline.dev/public/images/SLIME_BALL.png")';
					numItem.onclick = () => {
						let newItem : DFNumber = {
							id: 'num',
							data: {
								name: '',
							}
						}
						workItem(newItem);
					}
					contextMenu.append(numItem);

					const locItem = document.createElement('button');
					locItem.classList.add('newValue');
					locItem.style.backgroundImage = 'url("https://dfonline.dev/public/images/PAPER.png")';
					locItem.onclick = () => {
						let newItem : DFLocation = {
							id: 'loc',
							data: {
								isBlock: false,
								loc: {
									x: 0,
									y: 0,
									z: 0,
									pitch: 0,
									yaw: 0
								},
							}
						}
						workItem(newItem);
					}
					contextMenu.append(locItem);

					const vecItem = document.createElement('button');
					vecItem.classList.add('newValue');
					vecItem.style.backgroundImage = 'url("https://dfonline.dev/public/images/PRISMARINE_SHARD.png")';
					vecItem.onclick = () => {
						let newItem : Vector = {
							id: 'vec',
							data: {
								x: 0,
								y: 0,
								z: 0,
							}
						}
						workItem(newItem);
					}
					contextMenu.append(vecItem);

					const soundItem = document.createElement('button');
					soundItem.classList.add('newValue');
					soundItem.style.backgroundImage = 'url("https://dfonline.dev/public/images/NAUTILUS_SHELL.png")';
					soundItem.onclick = () => {
						let newItem : Sound = {
							id: 'snd',
							data: {
								sound: '',
								vol: 2,
								pitch: 1,
							}
						}
						workItem(newItem);
					}
					contextMenu.append(soundItem);

					const gameValueItem = document.createElement('button');
					gameValueItem.classList.add('newValue');
					gameValueItem.style.backgroundImage = 'url("https://dfonline.dev/public/images/NAME_TAG.png")';
					gameValueItem.onclick = () => {
						let newItem : GameValue = {
							id: 'g_val',
							data: {
								target: 'Default',
								type: '',
							}
						}
						workItem(newItem);
					}
					contextMenu.append(gameValueItem);

					const potionItem = document.createElement('button');
					potionItem.classList.add('newValue');
					potionItem.style.backgroundImage = 'url("https://dfonline.dev/public/images/DRAGON_BREATH.png")';
					potionItem.onclick = () => {
						let newItem : Potion = {
							id: 'pot',
							data: {
								amp: 0,
								dur: 1000000,
								pot: 'Speed',
							}
						}
						workItem(newItem);
					}
					contextMenu.append(potionItem);
				}
				itemElement.oncontextmenu = itemElement.onclick;
			}

			if(!userMeta.canEdit){
				itemElement.draggable = false;
				itemElement.oncontextmenu = () => {return false;}
				itemElement.onclick = () => {return false;}
			}

			itemElement.classList.add('item')
			slot.appendChild(itemElement);
			menuDiv.append(slot);
		})
		let chestDiv = document.querySelector('#chest');
		if(chestDiv) {chestDiv.parentElement.replaceChild(menuDiv,chestDiv); return menuDiv;}
		else return menu(`(${id}) ${titleCase(dbBlockType.name)}: ${block.action}`,menuDiv);
	}
}

/**
 * Makes each word start with a capital letter
 */
function titleCase(str:string){return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());}