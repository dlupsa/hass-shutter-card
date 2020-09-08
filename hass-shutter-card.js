class ShutterCard extends HTMLElement {
  set hass(hass) {
    const _this = this;
    const entities = this.config.entities;
    
    //Init the card
    if (!this.card) {
      const card = document.createElement('ha-card');
      
      if (this.config.title) {
          card.header = this.config.title;
      }
    
      this.card = card;
      this.appendChild(card);
    
      let allShutters = document.createElement('div');
      allShutters.className = 'sc-shutters';
      entities.forEach(function(entity) {
        let entityId = entity;
        if (entity && entity.entity) {
            entityId = entity.entity;
        }
        
        let buttonsPosition = 'left';
        if (entity && entity.buttons_position) {
            buttonsPosition = entity.buttons_position.toLowerCase();
        }
        
        let titlePosition = 'top';
        if (entity && entity.title_position) {
            titlePosition = entity.title_position.toLowerCase();
        }

        let invertPercentage = false;
        if (entity && entity.invert_percentage) {
          invertPercentage = entity.invert_percentage;
        }
          
        let shutter = document.createElement('div');

        shutter.className = 'sc-shutter';
        shutter.dataset.shutter = entityId;
        shutter.innerHTML = `
          <div class="sc-shutter-top" ` + (titlePosition == 'bottom' ? 'style="display:none;"' : '') + `>
            <div class="sc-shutter-label"></div>
          </div>
          <div class="sc-shutter-middle" style="flex-direction: ` + (buttonsPosition == 'right' ? 'row-reverse': 'row') + `;">
            <div class="sc-shutter-buttons">
              <ha-icon-button icon="mdi:arrow-up" class="sc-shutter-button" data-command="up"></ha-icon-button><br>
              <ha-icon-button icon="mdi:stop" class="sc-shutter-button" data-command="stop"></ha-icon-button><br>
              <ha-icon-button icon="mdi:arrow-down" class="sc-shutter-button" data-command="down"></ha-icon-button>
            </div>
            <div class="sc-shutter-selector">
              <div class="sc-shutter-selector-picture">
                <div class="sc-shutter-selector-slide"></div>
                <div class="sc-shutter-selector-picker"></div>
              </div>
            </div>
			<div class="sc-shutter-position"></div>
          </div>
		  <div class="sc-shutter-bottom">
			<div class="sc-shutter-buttons" style="display: flex; width: 249px; flex-direction: row; margin: auto;">
              <ha-icon-button icon="mdi:arrow-top-right" class="sc-shutter-button" data-command="tilt-up"></ha-icon-button>
			  
			  <ha-paper-slider class="sc-shutter-slider" role="slider" tabindex="0" value="0" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-disabled="false" dir="null"></ha-paper-slider>
			  
              <ha-icon-button icon="mdi:arrow-bottom-left" class="sc-shutter-button" data-command="tilt-down"></ha-icon-button>
            </div>
          </div>
        `;
        
        let picture = shutter.querySelector('.sc-shutter-selector-picture');
        let slide = shutter.querySelector('.sc-shutter-selector-slide');
        let picker = shutter.querySelector('.sc-shutter-selector-picker');
        
        let mouseDown = function(event) {
            if (event.cancelable) {
              //Disable default drag event
              event.preventDefault();
            }
            
            _this.isUpdating = true;
            
            document.addEventListener('mousemove', mouseMove);
            document.addEventListener('touchmove', mouseMove);
            document.addEventListener('pointermove', mouseMove);
      
            document.addEventListener('mouseup', mouseUp);
            document.addEventListener('touchend', mouseUp);
            document.addEventListener('pointerup', mouseUp);
        };
  
        let mouseMove = function(event) {
          let newPosition = event.pageY - _this.getPictureTop(picture);
          _this.setPickerPosition(newPosition, picker, slide);
        };
           
        let mouseUp = function(event) {
          _this.isUpdating = false;
            
          let newPosition = event.pageY - _this.getPictureTop(picture);
          
          if (newPosition < _this.minPosition)
            newPosition = _this.minPosition;
          
          if (newPosition > _this.maxPosition)
            newPosition = _this.maxPosition;
          
          let percentagePosition = (newPosition - _this.minPosition) * 100 / (_this.maxPosition - _this.minPosition);
          
          if (invertPercentage) {
            _this.updateShutterPosition(hass, entityId, percentagePosition);
          } else {
            _this.updateShutterPosition(hass, entityId, 100 - percentagePosition);
          }
          
          document.removeEventListener('mousemove', mouseMove);
          document.removeEventListener('touchmove', mouseMove);
          document.removeEventListener('pointermove', mouseMove);
      
          document.removeEventListener('mouseup', mouseUp);
          document.removeEventListener('touchend', mouseUp);
          document.removeEventListener('pointerup', mouseUp);
        };
      
        //Manage slider update
        picker.addEventListener('mousedown', mouseDown);
        picker.addEventListener('touchstart', mouseDown);
        picker.addEventListener('pointerdown', mouseDown);
        
        //Manage click on buttons
        shutter.querySelectorAll('.sc-shutter-button').forEach(function (button) {
            button.onclick = function () {
                const command = this.dataset.command;
                
                let service = '';
                
                switch (command) {
                  case 'up':
                      service = 'open_cover';
                      break;
                      
                  case 'down':
                      service = 'close_cover';
                      break;
                
                  case 'stop':
                      service = 'stop_cover';
                      break;
					  
				  case 'tilt-up':
                      service = 'open_cover_tilt';
                      break;
					  
				  case 'tilt-down':
                      service = 'close_cover_tilt';
                      break;
					  
                }
                
                hass.callService('cover', service, {
                  entity_id: entityId
                });
            };
        });
		
		shutter.querySelectorAll('.sc-shutter-slider').forEach(function (slider) {
			slider.onchange = function () {
				hass.callService('cover', 'set_cover_tilt_position', {
					entity_id: entityId,
					tilt_position: this.value
				});
			};
		});
      
        allShutters.appendChild(shutter);
      });
      
      
      const style = document.createElement('style');
      style.textContent = `
        .sc-shutters { padding: 16px; }
          .sc-shutter { margin-top: 1rem; overflow: hidden; }
          .sc-shutter:first-child { margin-top: 0; }
          .sc-shutter-middle { display: flex; width: 249px; margin: auto; }
            .sc-shutter-buttons { flex: 1; text-align: center; margin-top: 0.4rem; }
            .sc-shutter-selector { flex: 1; }
              .sc-shutter-selector-picture { position: relative; margin: auto; background-size: cover; min-height: 150px; max-height: 100%; width: 153px; }
                .sc-shutter-selector-picture { background-image:  url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJkAAACXCAYAAAAGVvnKAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDggNzkuMTY0MDM2LCAyMDE5LzA4LzEzLTAxOjA2OjU3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjEuMCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTA3LTE3VDE0OjU5OjM0KzAyOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMC0wNy0xN1QxNTowODo0MSswMjowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wNy0xN1QxNTowODo0MSswMjowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowODk4OGIwMy00YjE0LWIw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'); }
              .sc-shutter-selector-slide { position: absolute; top: 19px; left: 9px; width: 88%; height: 0; }
                .sc-shutter-selector-slide { background-image:  url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAGCAYAAAACEPQxAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDggNzkuMTY0MDM2LCAyMDE5LzA4LzEzLTAxOjA2OjU3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjEuMCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTA3LTE3VDE0OjU5OjM0KzAyOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMC0wNy0xN1QxNTowNjo0OSswMjowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wNy0xN1QxNTowNjo0OSswMjowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4ZmQwNGZiZC0xOWUwLTUxNDItYWY0Ni0xYTYyMDM5ODI0M2QiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OGZkMDRmYmQtMTllMC01MTQyLWFmNDYtMWE2MjAzOTgyNDNkIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OGZkMDRmYmQtMTllMC01MTQyLWFmNDYtMWE2MjAzOTgyNDNkIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo4ZmQwNGZiZC0xOWUwLTUxNDItYWY0Ni0xYTYyMDM5ODI0M2QiIHN0RXZ0OndoZW49IjIwMjAtMDctMTdUMTQ6NTk6MzQrMDI6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMS4wIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5qCAb3AAAAJElEQVQIW2Ows7NbzcTKyurF9OnTJy6m58+fMzB9//4dTBwGAKVMDevZFZ+6AAAAAElFTkSuQmCC'); }
              .sc-shutter-selector-picker { position: absolute; top: 19px; left: 9px; width: 88%; cursor: pointer; height: 20px; background-repeat: no-repeat; }
                .sc-shutter-selector-picker { background-image:  url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIkAAAAHCAYAAAA8nm5hAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAF42lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDggNzkuMTY0MDM2LCAyMDE5LzA4LzEzLTAxOjA2OjU3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjEuMCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTA3LTE3VDE0OjU5OjM0KzAyOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMC0wNy0xN1QxNToxMzo1NSswMjowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wNy0xN1QxNToxMzo1NSswMjowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpiYWFhZDk4Yi1mMDFkLTAyNDAtYWZhMC05Y2QyMjQ1M2E1MzciIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NGNkOTE5YzgtOWI2Ni05MDQ4LWJiMWQtOTYyYmQ1YWI3YzlmIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6NGNkOTE5YzgtOWI2Ni05MDQ4LWJiMWQtOTYyYmQ1YWI3YzlmIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo0Y2Q5MTljOC05YjY2LTkwNDgtYmIxZC05NjJiZDVhYjdjOWYiIHN0RXZ0OndoZW49IjIwMjAtMDctMTdUMTQ6NTk6MzQrMDI6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMS4wIChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YmFhYWQ5OGItZjAxZC0wMjQwLWFmYTAtOWNkMjI0NTNhNTM3IiBzdEV2dDp3aGVuPSIyMDIwLTA3LTE3VDE1OjEzOjU1KzAyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjEuMCAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+JQubsgAAANxJREFUSInt1EkKgzAUBmBJMVonUHHAYS247yG66WF6ou5ddtFDeB6NCVSapAjZtLWoK5/wEXmRJ0l+gqqqurqu22CMG8MwAJB0XW/yPL/VdX1FvHAyTfNi2zYAkmVZEs/GWeQD8SIW+G2CHceRI9g3z/PkeHw/GFFKx2EYNABUPBcaY+zJjYgQImh930td1wEg8VwcRD6Q7/ssiiIqxHFMp/cl1uqzd2IfJ0vP4VsvdU4VhiEJgoChNE3boijuk7IsF1uz19Y+rV2tz53f0j///fXt3F5Zlj2SJGlfXsAJ+Z3a/P4AAAAASUVORK5CYII='); }
          .sc-shutter-top { text-align: center; margin-bottom: 1rem; }
          .sc-shutter-bottom { text-align: center; margin-top: 1rem; }
            .sc-shutter-label { display: inline-block; font-size: 20px; vertical-align: middle; }
            .sc-shutter-position {width: 48px; flex: 1; text-align: center; margin-top: 0.4rem; padding-top: 60px;}
			.sc-shutter-slider {width: 153px;}
      `;
    
      this.card.appendChild(allShutters);
      this.appendChild(style);
    }
    
    //Update the shutters UI
    entities.forEach(function(entity) {
      let entityId = entity;
      if (entity && entity.entity) {
        entityId = entity.entity;
      }

      let invertPercentage = false;
      if (entity && entity.invert_percentage) {
        invertPercentage = entity.invert_percentage;
      }
        
      const shutter = _this.card.querySelector('div[data-shutter="' + entityId +'"]');
      const slide = shutter.querySelector('.sc-shutter-selector-slide');
      const picker = shutter.querySelector('.sc-shutter-selector-picker');
      const tiltSlider = shutter.querySelector('.sc-shutter-slider');
        
      const state = hass.states[entityId];
      const friendlyName = (entity && entity.name) ? entity.name : state ? state.attributes.friendly_name : 'unknown';
      const currentPosition = state ? state.attributes.current_position : 'unknown';
	  const currentTiltPosition = state ? state.attributes.current_tilt_position : 'unknown';
      
      shutter.querySelectorAll('.sc-shutter-label').forEach(function(shutterLabel) {
          shutterLabel.innerHTML = friendlyName;
      })
      
	  shutter.querySelectorAll('.sc-shutter-slider').forEach(function (shutterTiltPosition) {
        shutterTiltPosition.value = currentTiltPosition;
      })
	  
      if (!_this.isUpdating) {
        shutter.querySelectorAll('.sc-shutter-position').forEach(function (shutterPosition) {
          shutterPosition.innerHTML = currentPosition + '%';
        })
		
        if (invertPercentage) {
          _this.setPickerPositionPercentage(currentPosition, picker, slide);
        } else {
          _this.setPickerPositionPercentage(100 - currentPosition, picker, slide);
        }
      }
    });
  }
  
  getPictureTop(picture) {
      let pictureBox = picture.getBoundingClientRect();
      let body = document.body;
      let docEl = document.documentElement;

      let scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;

      let clientTop = docEl.clientTop || body.clientTop || 0;

      let pictureTop  = pictureBox.top + scrollTop - clientTop;
      
      return pictureTop;
  }
  
  setPickerPositionPercentage(position, picker, slide) {
    let realPosition = (this.maxPosition - this.minPosition) * position / 100 + this.minPosition;
  
    this.setPickerPosition(realPosition, picker, slide);
  }
  
  setPickerPosition(position, picker, slide) {
    if (position < this.minPosition)
      position = this.minPosition;
  
    if (position > this.maxPosition)
      position = this.maxPosition;
  
    picker.style.top = position + 'px';
    slide.style.height = position - this.minPosition + 'px';
  }
  
  updateShutterPosition(hass, entityId, position) {
    let shutterPosition = Math.round(position);
  
    hass.callService('cover', 'set_cover_position', {
      entity_id: entityId,
      position: shutterPosition
    });
  }
  
  updateShutterTiltPosition(hass, entityId, position) {
    let shutterTiltPosition = Math.round(position);
  
    hass.callService('cover', 'set_cover_tilt_position', {
      entity_id: entityId,
      position: shutterTiltPosition
    });
  }

  setConfig(config) {
    if (!config.entities) {
      throw new Error('You need to define entities');
    }
    
    this.config = config;
    this.maxPosition = 137;
    this.minPosition = 19;
    this.isUpdating = false;
  }

  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns.
  getCardSize() {
    return this.config.entities.length + 1;
  }
}

customElements.define("shutter-card", ShutterCard);
