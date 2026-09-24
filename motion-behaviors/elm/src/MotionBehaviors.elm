module MotionBehaviors exposing
    ( Config
    , Finish(..)
    , Item
    , Model
    , Msg(..)
    , Phase(..)
    , attributes
    , current
    , defaultConfig
    , init
    , isFinished
    , start
    , update
    )

import Html exposing (Attribute)
import Html.Attributes exposing (attribute, class, style)
import Html.Events exposing (on)
import Json.Decode as Decode
import Process
import Task


type Finish
    = Visible
    | Hidden
    | Remove


type Phase
    = Idle
    | Entering
    | Waiting
    | Exiting
    | Finished


type alias Item =
    { id : String
    , enter : String
    , exit : Maybe String
    , waitMs : Float
    , finish : Finish
    , last : Bool
    }


type alias Config =
    { animatedClass : String
    , prefix : String
    }


defaultConfig : Config
defaultConfig =
    { animatedClass = "animate__animated"
    , prefix = "animate__"
    }


type alias Model =
    { items : List Item
    , index : Int
    , phase : Phase
    , started : Bool
    }


type Msg
    = Start
    | AnimationEnded
    | WaitEnded
    | Reset


init : List Item -> ( Model, Cmd Msg )
init items =
    ( { items = items
      , index = 0
      , phase = Idle
      , started = False
      }
    , Cmd.none
    )


start : Model -> ( Model, Cmd Msg )
start model =
    if List.isEmpty model.items then
        ( { model | started = True, phase = Finished }, Cmd.none )

    else
        ( { model | started = True, phase = Entering }, Cmd.none )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Start ->
            start model

        Reset ->
            init model.items

        AnimationEnded ->
            case current model of
                Nothing ->
                    ( { model | phase = Finished }, Cmd.none )

                Just item ->
                    case model.phase of
                        Entering ->
                            if item.last || item.exit == Nothing then
                                advanceOrFinish model item

                            else if item.waitMs > 0 then
                                ( { model | phase = Waiting }
                                , Process.sleep item.waitMs
                                    |> Task.perform (always WaitEnded)
                                )

                            else
                                ( { model | phase = Exiting }, Cmd.none )

                        Exiting ->
                            advanceOrFinish model item

                        _ ->
                            ( model, Cmd.none )

        WaitEnded ->
            if model.phase == Waiting then
                ( { model | phase = Exiting }, Cmd.none )

            else
                ( model, Cmd.none )


advanceOrFinish : Model -> Item -> ( Model, Cmd Msg )
advanceOrFinish model item =
    let
        nextIndex =
            model.index + 1
    in
    if item.last || nextIndex >= List.length model.items then
        ( { model | phase = Finished }, Cmd.none )

    else
        ( { model | index = nextIndex, phase = Entering }, Cmd.none )


current : Model -> Maybe Item
current model =
    model.items
        |> List.drop model.index
        |> List.head


isFinished : Model -> Bool
isFinished model =
    model.phase == Finished


attributes : (Msg -> parentMsg) -> Config -> Model -> Int -> List (Attribute parentMsg)
attributes wrap config model itemIndex =
    case itemAt itemIndex model.items of
        Nothing ->
            [ style "display" "none" ]

        Just item ->
            let
                active =
                    itemIndex == model.index && model.started

                animationClass name =
                    if String.startsWith config.prefix name then
                        name

                    else
                        config.prefix ++ name

                visibilityAttrs =
                    if not model.started then
                        [ style "visibility" "hidden" ]

                    else if itemIndex < model.index then
                        finishAttributes item.finish

                    else if itemIndex > model.index then
                        [ style "visibility" "hidden" ]

                    else
                        case model.phase of
                            Finished ->
                                finishAttributes item.finish

                            _ ->
                                []

                phaseAttrs =
                    if not active then
                        []

                    else
                        case model.phase of
                            Entering ->
                                [ class config.animatedClass
                                , class (animationClass item.enter)
                                , onAnimationEnd wrap
                                ]

                            Exiting ->
                                case item.exit of
                                    Just exitName ->
                                        [ class config.animatedClass
                                        , class (animationClass exitName)
                                        , onAnimationEnd wrap
                                        ]

                                    Nothing ->
                                        []

                            _ ->
                                []
            in
            [ attribute "data-behavior" (behaviorValue item)
            , attribute "data-motion-id" item.id
            , attribute "data-motion-phase" (phaseToString model.phase)
            ]
                ++ visibilityAttrs
                ++ phaseAttrs


onAnimationEnd : (Msg -> parentMsg) -> Attribute parentMsg
onAnimationEnd wrap =
    on "animationend" (Decode.succeed (wrap AnimationEnded))


finishAttributes : Finish -> List (Attribute msg)
finishAttributes finish =
    case finish of
        Visible ->
            [ style "visibility" "visible" ]

        Hidden ->
            [ style "visibility" "hidden" ]

        Remove ->
            [ style "display" "none" ]


behaviorValue : Item -> String
behaviorValue item =
    String.join " "
        ([ "animate", "el-in" ]
            ++ (case item.exit of
                    Just _ ->
                        [ "el-out" ]

                    Nothing ->
                        []
               )
            ++ (if item.last then
                    [ "last" ]

                else
                    []
               )
        )


phaseToString : Phase -> String
phaseToString phase =
    case phase of
        Idle ->
            "idle"

        Entering ->
            "entering"

        Waiting ->
            "waiting"

        Exiting ->
            "exiting"

        Finished ->
            "finished"


itemAt : Int -> List a -> Maybe a
itemAt index items =
    items
        |> List.drop index
        |> List.head
