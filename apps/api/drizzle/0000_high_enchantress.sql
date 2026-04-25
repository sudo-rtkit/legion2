CREATE TABLE "abilities" (
	"id" text PRIMARY KEY NOT NULL,
	"ability_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon_path" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "damage_matrix" (
	"attack_type" text NOT NULL,
	"armor_type" text NOT NULL,
	"multiplier" real NOT NULL,
	CONSTRAINT "damage_matrix_attack_type_armor_type_pk" PRIMARY KEY("attack_type","armor_type")
);
--> statement-breakpoint
CREATE TABLE "legions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon_path" text NOT NULL,
	"playable" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patches" (
	"version" text PRIMARY KEY NOT NULL,
	"released_at" timestamp NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" text PRIMARY KEY NOT NULL,
	"mongo_id" text NOT NULL,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"unit_class" text NOT NULL,
	"category_class" text NOT NULL,
	"legion_id" text NOT NULL,
	"hp" real,
	"mp" real,
	"dps" real,
	"dmg_base" real,
	"dmg_max" real,
	"attack_speed" real,
	"attack_range" real,
	"attack_type" text NOT NULL,
	"attack_mode" text NOT NULL,
	"armor_type" text NOT NULL,
	"move_speed" real,
	"move_type" text NOT NULL,
	"gold_cost" real,
	"gold_bounty" real,
	"mythium_cost" real,
	"income_bonus" real,
	"total_value" real,
	"stock_max" integer,
	"stock_time" real,
	"icon_path" text NOT NULL,
	"splash_path" text NOT NULL,
	"description" text NOT NULL,
	"flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"abilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"upgrades_from" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_enabled" boolean NOT NULL,
	"sort_order" text NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waves" (
	"id" text PRIMARY KEY NOT NULL,
	"level_num" integer NOT NULL,
	"name" text NOT NULL,
	"amount" integer NOT NULL,
	"amount2" integer,
	"wave_unit_id" text NOT NULL,
	"spell_unit_2_id" text,
	"prepare_time" integer NOT NULL,
	"total_reward" integer NOT NULL,
	"icon_path" text NOT NULL,
	"is_king_wave" boolean NOT NULL
);
