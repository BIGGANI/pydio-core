/*
 * Copyright 2007-2017 Charles du Jeu - Abstrium SAS <team (at) pyd.io>
 * This file is part of Pydio.
 *
 * Pydio is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Pydio is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Pydio.  If not, see <http://www.gnu.org/licenses/>.
 *
 * The latest code can be found at <https://pydio.com>.
 */

import React, {Component} from 'react';

import {ToolbarGroup, IconButton, FlatButton, Card, CardTitle, CardText, Table, TableBody, TableRow, TableRowColumn} from 'material-ui'

class Panel extends Component {

    parseValues(node){
        const configs = this.props.pydio.getPluginConfigs('meta.exif');
        if(!configs.has('meta_definitions')){
            return;
        }

        const nodeMeta = node.getMetadata();
        const definitions = configs.get('meta_definitions');

        let items = Object.keys(definitions)
            .filter(key => nodeMeta.has(key))
            .map(key => ({key, label: definitions[key], value: nodeMeta.get(key).split('--').shift()}))

        let gpsData = ["COMPUTED_GPS-GPS_Latitude", "COMPUTED_GPS-GPS_Longitude"]
            .filter(key => nodeMeta.has(key))
            .map((key) => ({key, value: nodeMeta.get(key)}))
            .reduce((obj, cur) => ({...obj, [cur.key]: cur.value }), {});

        if(gpsData['COMPUTED_GPS-GPS_Longitude'] && gpsData['COMPUTED_GPS-GPS_Latitude']){
            // Special Case
            ResourcesManager.loadClassesAndApply(['OpenLayers', 'PydioMaps'], () => this.setState({gpsData}));
        }

        this.setState({items});
    }

    componentDidMount() {
        this.parseValues(this.props.node);
    }

    componentWillReceiveProps(nextProps){
        if(nextProps.node !== this.props.node){
            this.setState({gpsData:null});
            this.parseValues(nextProps.node);
        }
    }

    mapLoaded(map, error){
        if (error && console) console.log(error);
    }

    openInExifEditor() {
        const {pydio, node} = this.props

        const editor = pydio.Registry.findEditorById("editor.exif");
        if (editor) {
            pydio.UI.openCurrentSelectionInEditor(editor, node);
        }
    }

    openInMapEditor() {
        const {pydio, node} = this.props

        const editors = pydio.Registry.findEditorsForMime("ol_layer");
        if (editors.length) {
            pydio.UI.openCurrentSelectionInEditor(editors[0], node);
        }
    }

    render(){

        let items = [];
        let actions = [];
        if (this.state && this.state.items) {

            const fields = this.state.items.map(function(object){
                return (
                    <div key={object.key} className="infoPanelRow" style={{float:'left', width: '50%', padding: '0 4px 12px', whiteSpace:'nowrap'}}>
                        <div className="infoPanelLabel">{object.label}</div>
                        <div className="infoPanelValue">{object.value}</div>
                    </div>
                )
            });
            items.push(<div style={{padding: '0 12px'}}>{fields}</div>)
            items.push(<div style={{clear:'left'}}></div>)

            actions.push(
                <FlatButton onClick={() => this.openInExifEditor()} label={this.props.pydio.MessageHash['456']} />
            );
        }
        if (this.state && this.state.gpsData) {
            items.push(
                <PydioReactUI.AsyncComponent
                    namespace="PydioMaps"
                    componentName="OLMap"
                    key="map"
                    style={{height: 170, marginBottom:0, padding:0}}
                    centerNode={this.props.node}
                    mapLoaded={this.mapLoaded}
                />
            );
            actions.push(
                <FlatButton onClick={() => this.openInMapEditor()} label={this.props.pydio.MessageHash['meta.exif.2']} />
            )
        }

        if (!items.length) {
            return null;
        }
        return (
            <PydioWorkspaces.InfoPanelCard style={this.props.style} title={this.props.pydio.MessageHash['meta.exif.3']} actions={actions} icon="camera" iconColor="#607d8b">
                {items}
            </PydioWorkspaces.InfoPanelCard>
        );

    }
}

export default Panel;
