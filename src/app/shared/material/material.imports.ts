import { AsyncPipe, JsonPipe  } from "@angular/common";
import { MatButton, MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatTableModule } from "@angular/material/table";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltip } from "@angular/material/tooltip";
import { RouterLink, RouterOutlet } from "@angular/router";


export const MATERIAL_IMPORTS = [
    MatButton, 
    MatButtonModule, 
    MatTooltip, 
    MatIconModule, 
    MatPaginatorModule, 
    MatTableModule, 
    MatDialogModule, 
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    RouterOutlet,
    RouterLink,
    MatExpansionModule,
    AsyncPipe,

];


export const MATERIAL_SETTINGS_IMPORTS = [
    MatButton,
    MatButtonModule,
    MatTooltip,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    MatDialogModule,
];
