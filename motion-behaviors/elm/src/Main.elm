module Main exposing (main)

import Browser
import Html exposing (Html, button, div, h1, p, text)
import Html.Events exposing (onClick)
import MotionBehaviors as Motion


type alias Model =
    { motion : Motion.Model }


type Msg
    = MotionMsg Motion.Msg
    | Replay


items : List Motion.Item
items =
    [ { id = "logo"
      , enter = "zoomInDown"
      , exit = Just "zoomOutDown"
      , waitMs = 1200
      , finish = Motion.Hidden
      , last = False
      }
    , { id = "headline"
      , enter = "fadeInUp"
      , exit = Just "fadeOutDown"
      , waitMs = 900
      , finish = Motion.Hidden
      , last = False
      }
    , { id = "submit"
      , enter = "bounceIn"
      , exit = Nothing
      , waitMs = 0
      , finish = Motion.Visible
      , last = True
      }
    ]


init : () -> ( Model, Cmd Msg )
init _ =
    let
        ( motion, cmd ) =
            Motion.init items

        ( started, startCmd ) =
            Motion.start motion
    in
    ( { motion = started }
    , Cmd.batch
        [ Cmd.map MotionMsg cmd
        , Cmd.map MotionMsg startCmd
        ]
    )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        MotionMsg motionMsg ->
            let
                ( nextMotion, cmd ) =
                    Motion.update motionMsg model.motion
            in
            ( { model | motion = nextMotion }
            , Cmd.map MotionMsg cmd
            )

        Replay ->
            let
                ( resetMotion, _ ) =
                    Motion.update Motion.Reset model.motion

                ( startedMotion, cmd ) =
                    Motion.start resetMotion
            in
            ( { model | motion = startedMotion }
            , Cmd.map MotionMsg cmd
            )


view : Model -> Html Msg
view model =
    div []
        [ h1 [] [ text "motion-behaviors.css — Elm runtime" ]
        , p [] [ text "This sequence is orchestrated by Elm itself." ]
        , motionNode 0 "LOGO" model
        , motionNode 1 "Headline" model
        , motionNode 2 "Submit" model
        , button [ onClick Replay ] [ text "Replay" ]
        ]


motionNode : Int -> String -> Model -> Html Msg
motionNode index label model =
    div
        (List.map (Html.Attributes.map MotionMsg) (Motion.attributes Motion.defaultConfig model.motion index))
        [ text label ]


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none


main : Program () Model Msg
main =
    Browser.element
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }
